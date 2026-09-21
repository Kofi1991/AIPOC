#!/usr/bin/env python3
"""Git "clean" filter: scrubs real credentials out of a file as it goes INTO a commit.

Your working copy is never modified — Git runs this on the way to the index only, so the
values stay on your machine and only the scrubbed text is ever committed or pushed.

Wired up by tools/install-git-hooks.sh (filter.scrub-secrets.clean in .git/config) and
.gitattributes (which files it applies to). Reads stdin, writes stdout. Idempotent.

It replaces:
  * any value in .env whose key looks like a real credential (not the fake TC_INVALID_* account)
    - quoted occurrences  'value'  ->  process.env.<KEY>
    - bare occurrences    value    ->  <KEY>
  * literal assignments such as  const username = '...';  /  const password = '...';
    (a generated spec can hold a credential that isn't in .env any more)
"""
import os
import re
import subprocess
import sys

ROOT = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip() or '.'
REAL_KEY = re.compile(r'PASS|SECRET|TOKEN|SESSION|KEY|COOKIE|_USER$|EMAIL', re.I)
FAKE_KEY = re.compile(r'^TC_INVALID_', re.I)

ASSIGNMENTS = [
    (re.compile(r"((?:const|let|var)\s+(?:username|userName|adminUser|adminEmail|email)\s*=\s*)(['\"])[^'\"\n]*\2"), r'\1process.env.TC_ADMIN_USER'),
    (re.compile(r"((?:const|let|var)\s+(?:password|passWord|adminPass|adminPassword)\s*=\s*)(['\"])[^'\"\n]*\2"), r'\1process.env.TC_ADMIN_PASS'),
]


def env_secrets():
    path = os.path.join(ROOT, '.env')
    out = []
    if not os.path.exists(path):
        return out
    for raw in open(path, errors='ignore'):
        raw = raw.strip()
        if not raw or raw.startswith('#') or '=' not in raw:
            continue
        key, val = raw.split('=', 1)
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if REAL_KEY.search(key) and not FAKE_KEY.match(key) and len(val) >= 6:
            out.append((key, val))
    # longest first, so a value that contains another is replaced whole
    return sorted(out, key=lambda kv: -len(kv[1]))


def scrub(text):
    for pattern, repl in ASSIGNMENTS:
        text = pattern.sub(repl, text)
    for key, val in env_secrets():
        text = re.sub(r"(['\"])" + re.escape(val) + r"\1", f'process.env.{key}', text)
        text = text.replace(val, f'<{key}>')
    return text


if __name__ == '__main__':
    sys.stdout.write(scrub(sys.stdin.read()))

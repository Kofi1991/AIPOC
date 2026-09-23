#!/usr/bin/env python3
"""Blocks secrets from being committed.

    python3 tools/check_secrets.py            # scan what is staged (the default; the pre-commit hook uses this)
    python3 tools/check_secrets.py --pending  # scan everything uncommitted: changes vs HEAD + new, unignored files
    python3 tools/check_secrets.py --history  # scan every added line in every commit, on every branch

Only *added* lines are scanned, so a secret that is already in history does not block
unrelated commits — use --history to find those. Matches are printed redacted: the secret
itself is never written to the terminal or to any log.

Exit code 1 means a BLOCK finding: do not commit. Warnings (fake test credentials) do not fail.
"""
import os
import re
import subprocess
import sys

ROOT = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip() or '.'

# Paths that must never be committed, whatever they contain.
BLOCKED_PATHS = [
    (r'(^|/)\.env($|\.)', 'environment file'),
    (r'(^|/)\.mcp\.json$', 'MCP config (holds tokens)'),
    (r'\.(pem|key|p12|pfx|jks|keystore)$', 'key / certificate file'),
    (r'(^|/)id_(rsa|dsa|ecdsa|ed25519)', 'SSH private key'),
    (r'(^|/)playwright/\.auth/', 'saved browser login state'),
    (r'(storage-?state|auth-?state)[^/]*\.json$', 'saved browser login state'),
    (r'(^|/)(test-results|playwright-report|blob-report)/', 'run output (videos, traces, screenshots)'),
    (r'(^|/)reports/run-history-artifacts/', 'run artifacts'),
    (r'(^|/)\.playwright-mcp/', 'MCP browser session output'),
]

# Patterns that look like a secret wherever they appear in an added line.
PATTERNS = [
    (r'\bS?SESS[0-9a-f]{20,}', 'Drupal session cookie'),
    (r'\bghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}', 'GitHub token'),
    (r'\bsk-ant-[A-Za-z0-9_\-]{20,}', 'Anthropic API key'),
    (r'\bsk-[A-Za-z0-9]{32,}', 'API key (sk-)'),
    (r'\bAKIA[0-9A-Z]{16}\b', 'AWS access key id'),
    (r'\bxox[baprs]-[A-Za-z0-9-]{10,}', 'Slack token'),
    (r'-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----', 'private key'),
    (r'(?i)\bbearer\s+[A-Za-z0-9._\-]{24,}', 'bearer token'),
    (r'(?i)authorization\s*[:=]\s*[\'"]?basic\s+[A-Za-z0-9+/=]{16,}', 'basic-auth header'),
    (r'(?i)\b(cookie|set-cookie)\s*[:=]\s*[\'"][^\'"\s]{24,}[\'"]', 'cookie value'),
    # (?<!-) skips HTTP header names such as X-Atlassian-Token, which are not credentials
    (r'(?i)(?<!-)\b(pass(word)?|passwd|pwd|secret|api[_-]?key|token)\b[\'"]?\s*[:=]\s*[\'"][^\'"\s${}]{6,}[\'"]', 'literal credential assignment'),
    (r'https?://[^\s/:@]+:[^\s/@]{3,}@', 'password inside a URL'),
]
# A pattern hit on a line that only *reads* a variable is fine.
SAFE_LINE = re.compile(r'process\.env\.|\$\{?[A-Z_]{3,}\}?|os\.environ|getenv\(|<[A-Z_]+>|no-hardcoded-credentials|hardcoded password')

SECRET_KEY = re.compile(r'PASS|SECRET|TOKEN|SESSION|KEY|COOKIE|_USER$|EMAIL', re.I)
FAKE_KEY = re.compile(r'^TC_INVALID_', re.I)  # deliberately fake accounts for the invalid-login test


def env_values():
    """(name, value, is_fake) for secret-like values in .env — never printed."""
    path = os.path.join(ROOT, '.env')
    found = []
    if not os.path.exists(path):
        return found
    for raw in open(path, errors='ignore'):
        raw = raw.strip()
        if not raw or raw.startswith('#') or '=' not in raw:
            continue
        key, val = raw.split('=', 1)
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if SECRET_KEY.search(key) and len(val) >= 6:
            found.append((key, val, bool(FAKE_KEY.match(key))))
    return found


def git(*args):
    return subprocess.run(['git', *args], capture_output=True, text=True, errors='replace', cwd=ROOT).stdout


def added_lines(mode):
    """Yield (path, line_number, text) for every added line in the chosen scope."""
    if mode == 'history':
        diff = git('log', '--all', '-p', '--no-color', '-U0', '--format=commit %h')
    elif mode == 'pending':
        diff = git('diff', 'HEAD', '--no-color', '-U0')
    else:
        diff = git('diff', '--cached', '--no-color', '-U0')
    path, line_no = None, 0
    for row in diff.splitlines():
        if row.startswith('+++ b/'):
            path = row[6:]
        elif row.startswith('@@'):
            m = re.search(r'\+(\d+)', row)
            line_no = int(m.group(1)) - 1 if m else 0
        elif row.startswith('+') and not row.startswith('+++'):
            line_no += 1
            yield path, line_no, row[1:]
    if mode == 'pending':
        for rel in git('ls-files', '--others', '--exclude-standard').splitlines():
            full = os.path.join(ROOT, rel)
            try:
                if os.path.getsize(full) > 2_000_000:
                    continue
                with open(full, errors='ignore') as fh:
                    for i, text in enumerate(fh, 1):
                        yield rel, i, text.rstrip('\n')
            except OSError:
                continue


def changed_paths(mode):
    if mode == 'history':
        return set(git('log', '--all', '--name-only', '--format=').splitlines())
    if mode == 'pending':
        return set(git('diff', 'HEAD', '--name-only').splitlines()) | set(git('ls-files', '--others', '--exclude-standard').splitlines())
    return set(git('diff', '--cached', '--name-only').splitlines())


def main():
    mode = 'history' if '--history' in sys.argv else 'pending' if '--pending' in sys.argv else 'staged'
    blocks, warns = [], []

    for path in sorted(p for p in changed_paths(mode) if p):
        for rx, why in BLOCKED_PATHS:
            if re.search(rx, path):
                blocks.append((path, 0, f'{why} — this path must never be committed'))
                break

    values = env_values()
    for path, n, text in added_lines(mode):
        if not path:
            continue
        for name, val, fake in values:
            if val in text:
                (warns if fake else blocks).append((path, n, f'contains the value of {name} from .env' + (' (fake test account)' if fake else '')))
        if SAFE_LINE.search(text):
            continue
        for rx, why in PATTERNS:
            if re.search(rx, text):
                blocks.append((path, n, why))
                break

    seen = set()
    def show(items, label):
        for path, n, why in items:
            key = (path, n, why)
            if key in seen:
                continue
            seen.add(key)
            where = f'{path}:{n}' if n else path
            print(f'  {label} {where} — {why}')

    scope = {'staged': 'staged changes', 'pending': 'all uncommitted work', 'history': 'every commit'}[mode]
    if blocks:
        print(f'check_secrets: BLOCKED — possible secrets in {scope}:')
        show(blocks, 'BLOCK')
        show(warns, 'warn ')
        print('Unstage the file(s), remove or replace the value with process.env.<NAME>, and re-run. Values are never printed.')
        return 1
    if warns:
        print(f'check_secrets: OK, with warnings for {scope}:')
        show(warns, 'warn ')
        return 0
    print(f'check_secrets: clean — no secrets found in {scope}.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

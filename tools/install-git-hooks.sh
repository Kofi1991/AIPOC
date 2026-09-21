#!/usr/bin/env bash
# Once per clone, installs the two local safeguards against committing secrets:
#   1. a pre-commit hook that runs tools/check_secrets.py, so a secret is blocked even when the
#      commit isn't made through Dr.Git;
#   2. the "scrub-secrets" clean filter (see .gitattributes) that strips real credentials out of
#      promptfooconfig.yaml on the way into a commit while leaving your working copy untouched.
# Neither is tracked by Git (.git/hooks and .git/config are local), hence this script. It does
# not touch your identity (user.name / user.email) or any other git setting.
set -e
root="$(git rev-parse --show-toplevel)"
hook="$root/.git/hooks/pre-commit"
if [ -e "$hook" ] && ! grep -q "check_secrets.py" "$hook"; then
  echo "A different pre-commit hook already exists at $hook — not overwriting it." >&2
  echo "Add this line to it instead:  python3 tools/check_secrets.py || exit 1" >&2
  exit 1
fi
cat > "$hook" <<'HOOK'
#!/usr/bin/env bash
# Installed by tools/install-git-hooks.sh — blocks commits that contain secrets.
cd "$(git rev-parse --show-toplevel)" && python3 tools/check_secrets.py
HOOK
chmod +x "$hook"
echo "Installed pre-commit hook: $hook"

git -C "$root" config filter.scrub-secrets.clean "python3 tools/scrub_secrets.py"
git -C "$root" config filter.scrub-secrets.smudge cat
echo "Installed clean filter: filter.scrub-secrets (promptfooconfig.yaml is scrubbed when committed, not on disk)"

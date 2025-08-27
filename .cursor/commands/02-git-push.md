# /git-push

Push the committed changes to the remote repository.

## HOW TO USE

- `/git-push` → 現在のブランチを origin に push（初回は -u オプション付き）
- `/git-push branch-name` → 指定ブランチを push
- （⚠️ コミットがない場合はエラー）

## GIT COMMANDS IMPLEMENTATION

### Step 1: Detect current branch

```bash
git rev-parse --abbrev-ref HEAD
```

### Step 2: Check commits

```bash
git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD --oneline
```

### Step 3: Push to remote

```bash
# If first push for this branch

git push -u origin <branch>

# Else (branch already exists on remote)

git push origin <branch>
```

### Step 4: Confirmation

- Show branch name and commits to be pushed

## USAGE EXAMPLES

```bash
# Push current branch (auto detect)
git push -u origin feature/add-login

# Push explicitly specified branch
git push origin hotfix/fix-typo
```

NOTES

- Always verify current branch before push
- Prefer -u only for the first push of a branch
- Error if no commits ahead of remote
- After push, suggest opening PR: "ブランチを push しました。GitHub/GitLab で PR を作成してください。"

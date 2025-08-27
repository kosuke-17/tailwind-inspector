# /git-push

Push the committed changes to the remote repository.

## HOW TO USE

- `/git-push` → 現在のブランチを origin に push（初回は -u オプション付き）
- `/git-push branch-name` → 指定ブランチを push
- （⚠️ コミットがない場合はエラー）

## GIT COMMANDS IMPLEMENTATION

### Step 1: Determine target branch

```bash
# If args provided → use specified branch
TARGET_BRANCH={provided_arg}

# Else → detect current branch
TARGET_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

### Step 2: Validate target branch

```bash
# Check if target branch exists locally
git show-ref --verify --quiet refs/heads/$TARGET_BRANCH
# If not exists → error: "ブランチ '$TARGET_BRANCH' が存在しません"
```

### Step 3: Check commits

```bash
git log origin/$TARGET_BRANCH..$TARGET_BRANCH --oneline 2>/dev/null || echo "Initial push"
```

### Step 4: Push to remote

```bash
# If first push for this branch (remote branch doesn't exist)
git push -u origin $TARGET_BRANCH

# Else (branch already exists on remote)
git push origin $TARGET_BRANCH
```

## USAGE EXAMPLES

```bash
# Push current branch (auto detect)
/git-push
# → git push origin main

# Push specified branch
/git-push feature/add-login
# → git push origin feature/add-login

# Push to different remote branch
/git-push hotfix/fix-typo
# → git push origin hotfix/fix-typo
```

NOTES

- Always verify current branch before push
- Prefer -u only for the first push of a branch
- Error if no commits ahead of remote
- After push, suggest opening PR: "ブランチを push しました。GitHub/GitLab で PR を作成してください。"

# Git Workflow Commands

このファイルは、Git ワークフローを効率化するための Cursor コマンドをまとめたものです。

## Commands Overview

1. `/stage-commit` - ファイルをステージして AI 生成メッセージでコミット
2. `/git-push` - リモートリポジトリにプッシュ
3. `/pr-desc` - Pull Request / Merge Request の説明を自動生成
4. `/stage-push-pr` - 上記 3 つのコマンドを組み合わせた統合コマンド

---

## /stage-commit

Stage specific changes and commit with AI-generated message using Git commands.

### HOW TO USE

- `/stage-commit src/foo.ts` → 指定ファイルをステージ
- `/stage-commit apps/web/**` → ディレクトリ配下をステージ
- `/stage-commit *` → 全変更をステージ
- （⚠️ 引数なしはエラー）

### GIT COMMANDS IMPLEMENTATION

#### Step 1: Stage files

```bash
# If args == "*"
git add -A

# Else
git add {provided_args}
```

#### Step 2: Show staged files

```bash
git diff --staged --name-status
```

#### Step 3: Generate commit message

Based on staged files, create Conventional Commit format:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: スタイル
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: 設定・ビルド

#### Step 4: Commit with confirmation

```bash
git commit -m "<header>" -m "<body>"
```

### USAGE EXAMPLES

```bash
# Stage specific file
git add src/components/Button.tsx
git diff --staged --name-status
# → feat(components): Button.tsxを更新
git commit -m "feat(components): Button.tsxを更新"

# Stage all changes
git add -A
git diff --staged --name-status
# → feat: 3個のファイルを更新
git commit -m "feat: 3個のファイルを更新" -m "変更されたファイル..."

# Stage directory
git add src/hooks/
git diff --staged --name-status
# → feat(hooks): フックを更新
git commit -m "feat(hooks): フックを更新"
```

### COMMIT MESSAGE RULES

- Header ≤65 chars
- Format: `type(scope): description`
- Japanese descriptions
- Body for multiple files (>3)

---

## /git-push

Push the committed changes to the remote repository.

### HOW TO USE

- `/git-push` → 現在のブランチを origin に push（初回は -u オプション付き）
- `/git-push branch-name` → 指定ブランチを push
- （⚠️ コミットがない場合はエラー）

### GIT COMMANDS IMPLEMENTATION

#### Step 1: Determine target branch

```bash
# If args provided → use specified branch
TARGET_BRANCH={provided_arg}

# Else → detect current branch
TARGET_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

#### Step 2: Validate target branch

```bash
# Check if target branch exists locally
git show-ref --verify --quiet refs/heads/$TARGET_BRANCH
# If not exists → error: "ブランチ '$TARGET_BRANCH' が存在しません"
```

#### Step 3: Check commits

```bash
git log origin/$TARGET_BRANCH..$TARGET_BRANCH --oneline 2>/dev/null || echo "Initial push"
```

#### Step 4: Push to remote

```bash
# If first push for this branch (remote branch doesn't exist)
git push -u origin $TARGET_BRANCH

# Else (branch already exists on remote)
git push origin $TARGET_BRANCH
```

### USAGE EXAMPLES

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

### NOTES

- Always verify current branch before push
- Prefer -u only for the first push of a branch
- Error if no commits ahead of remote
- After push, suggest opening PR: "ブランチを push しました。GitHub/GitLab で PR を作成してください。"

---

## /pr-desc

Generate a Pull Request (GitHub) or Merge Request (GitLab) description from the current branch diff.

### HOW TO USE

- `/pr-desc` → 現在のブランチの差分からディスクリプションを生成
- （⚠️ push 済みであることが前提）

### GIT COMMANDS IMPLEMENTATION

#### Step 1: Detect current branch

```bash
git rev-parse --abbrev-ref HEAD
```

#### Step 2: Ensure remote branch exists

```bash
git fetch origin
git branch -r --contains HEAD
```

存在しない場合はエラー: "まず /git-push を実行してください"

#### Step 3: Collect diffs

```bash
# List changed files
git diff --name-status origin/main...HEAD > pr_files.txt

# Full diff (no context)
git diff -U0 origin/main...HEAD > pr_diff.patch
```

#### Step 4: Generate PR/MR description

Create PR_DESCRIPTION.md at repo root with structure:

```bash
# Title
短く (<72 chars)、変更の要約（例: feat(auth): ログインフロー改善）

## Summary
- なぜこの変更が必要か
- 何をどう変えたか

## Change Highlights
- ファイルやモジュールごとに箇条書き
- pr_files.txt をベースに重要変更を抜粋

## Risks & Rollback
- 想定されるリスク
- 戻し方

## Test Plan / QA
- テスト実施内容
- 再現手順・期待結果

## Performance / Security
- 影響があれば記載

## Related Issues
- Closes #123 / Fixes #456 など

## Checklist
- [ ] Docs 更新済み
- [ ] テスト追加/修正済み
- [ ] スクリーンショット/録画あり

```

#### Step 5: Platform-specific guidance

**GitHub:**

Push 後、`gh pr create --fill --title "<Title>" --body-file PR_DESCRIPTION.md` を提案

または GitHub Web UI で PR_DESCRIPTION.md をコピペ

**GitLab:**

Push 後、`glab mr create --fill --title "<Title>" --description-file PR_DESCRIPTION.md` を提案

または GitLab Web UI で PR_DESCRIPTION.md をコピペ

### USAGE EXAMPLES

```bash
# Generate PR/MR description
/pr-desc

# → PR_DESCRIPTION.md が生成される
# → gh pr create または glab mr create で利用可能
```

---

## /stage-push-pr

Run `/stage-commit {args}` (args required; "\*" = all).
After commit, run `/git-push [branch]`.
Then run `/pr-desc`.

### HOW TO USE

- `/stage-push-pr src/foo.ts` → ファイルをステージ・コミット・プッシュ（現在ブランチ）
- `/stage-push-pr src/foo.ts feature/new-ui` → ファイルをステージ・コミット・指定ブランチにプッシュ
- `/stage-push-pr *` → 全変更をステージ・コミット・プッシュ
- `/stage-push-pr * feature/new-ui` → 全変更をステージ・コミット・指定ブランチにプッシュ

### RULES

- If no args → error: "ステージ対象を指定してください（\* 可）"
- First arg: stage target (files/patterns or "\*")
- Second arg (optional): target branch name
- Confirm before commit & push.

---

## Workflow Summary

1. **開発作業** → ファイルを編集
2. **ステージ & コミット** → `/stage-commit <files>`
3. **プッシュ** → `/git-push [branch]`
4. **PR/MR 作成** → `/pr-desc`

または統合コマンドで一括実行:

- **全工程一括** → `/stage-push-pr <files> [branch]`

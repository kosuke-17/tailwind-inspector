# /pr-desc

Generate a Pull Request (GitHub) or Merge Request (GitLab) description from the current branch diff.

## HOW TO USE

- `/pr-desc` → 現在のブランチの差分からディスクリプションを生成
- （⚠️ push 済みであることが前提）

## GIT COMMANDS IMPLEMENTATION

### Step 1: Detect current branch

```bash
git rev-parse --abbrev-ref HEAD
```

### Step 2: Ensure remote branch exists

```bash
git fetch origin
git branch -r --contains HEAD
```

存在しない場合はエラー: "まず /git-push を実行してください"

### Step 3: Collect diffs

```bash
# List changed files
git diff --name-status origin/main...HEAD > pr_files.txt

# Full diff (no context)
git diff -U0 origin/main...HEAD > pr_diff.patch
```

### Step 4: Generate PR/MR description

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

### Step 5: Platform-specific guidance

GitHub:

Push 後、`gh pr create --fill --title "<Title>" --body-file PR_DESCRIPTION.md` を提案

または GitHub Web UI で PR_DESCRIPTION.md をコピペ

GitLab:

Push 後、`glab mr create --fill --title "<Title>" --description-file PR_DESCRIPTION.md` を提案

または GitLab Web UI で PR_DESCRIPTION.md をコピペ

## USAGE EXAMPLES

````bash
# Generate PR/MR description
/pr-desc

# → PR_DESCRIPTION.md が生成される
# → gh pr create または glab mr create で利用可能
```
````

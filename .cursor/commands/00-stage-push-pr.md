# /stage-push-pr

Run `/stage-commit {args}` (args required; "\*" = all).
After commit, run `/git-push [branch]`.
Then run `/pr-desc`.

## HOW TO USE

- `/stage-push-pr src/foo.ts` → ファイルをステージ・コミット・プッシュ（現在ブランチ）
- `/stage-push-pr src/foo.ts feature/new-ui` → ファイルをステージ・コミット・指定ブランチにプッシュ
- `/stage-push-pr *` → 全変更をステージ・コミット・プッシュ
- `/stage-push-pr * feature/new-ui` → 全変更をステージ・コミット・指定ブランチにプッシュ

## RULES

- If no args → error: "ステージ対象を指定してください（\* 可）"
- First arg: stage target (files/patterns or "\*")
- Second arg (optional): target branch name
- Confirm before commit & push.

# /stage-push-pr

Run `/stage-commit {args}` (args required; "\*" = all).
After commit, run `/git-push`.
Then run `/pr-desc`.

## RULES

- If no args → error: "ステージ対象を指定してください（\* 可）"
- Confirm before commit & push.

# feat(commands): Cursor Commands を追加

## Summary

- プロジェクトの開発効率を向上させるため、Cursor IDE の Commands 機能を活用した自動化コマンドを追加
- Git 操作の標準化とワークフローの効率化を実現
- チーム全体で一貫した開発プロセスを確立

## Change Highlights

### 新規追加された Cursor Commands

- **00-stage-push-pr.md**: ステージ・コミット・プッシュ・PR 作成を一括実行するコマンド
- **02-git-push.md**: 現在のブランチを安全にリモートにプッシュするコマンド
- **03-pr-desc.md**: プッシュ後の PR/MR 説明文を自動生成するコマンド

### 機能概要

- `/stage-push-pr {files}`: 指定ファイルをステージ → コミット → プッシュ →PR 作成までを自動化
- `/git-push`: ブランチ検出・コミット確認・安全なプッシュ処理
- `/pr-desc`: 変更差分から PR 説明文を自動生成

## Risks & Rollback

### リスク

- 低リスク：ドキュメントファイルの追加のみ
- Commands 機能を知らないチームメンバーには学習コストあり

### ロールバック

```bash
# ファイル削除で簡単にロールバック可能
rm .cursor/commands/00-stage-push-pr.md
rm .cursor/commands/02-git-push.md
rm .cursor/commands/03-pr-desc.md
```

## Test Plan / QA

### テスト実施内容

- [x] `/stage-push-pr *` コマンドの動作確認済み
- [x] Git add、commit、push の一連フロー確認済み
- [x] エラーハンドリング（引数なし）の確認済み

### 期待結果

- チャット入力欄で `/` を入力すると新しいコマンドが表示される
- 各コマンドが仕様通りに動作する
- ワークフローが効率化される

## Performance / Security

### パフォーマンス

- 影響なし：静的な Markdown ファイルの追加のみ

### セキュリティ

- 影響なし：実行可能コードは含まれず、ドキュメントのみ
- Git コマンドの実行は既存の権限内で行われる

## Related Issues

- プロジェクトの開発効率向上施策の一環
- TypeScript 化完了後の次のステップとして実装

## Checklist

- [x] Docs 更新済み (README.md に使用方法を記載済み)
- [x] テスト追加/修正済み (手動テスト完了)
- [ ] スクリーンショット/録画あり (必要に応じて追加可能)
- [x] Commands 機能の動作確認済み
- [x] Git 操作の安全性確認済み

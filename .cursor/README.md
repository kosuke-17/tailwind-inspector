# Cursor Commands

Git コマンドを使用したカスタムコマンド集

## stage-commit

ファイルをステージして Conventional Commit メッセージで自動コミットする Git ワークフロー

### 基本的な使い方

```bash
# 1. ファイルをステージ
git add src/components/Button.tsx

# 2. ステージ済みファイルを確認
git diff --staged --name-status

# 3. メッセージを生成してコミット
git commit -m "feat(components): Button.tsxを更新"
```

### コミットメッセージ生成ルール

| Type       | 用途             | ファイルパターン                  |
| ---------- | ---------------- | --------------------------------- |
| `feat`     | 新機能           | デフォルト                        |
| `fix`      | バグ修正         | -                                 |
| `docs`     | ドキュメント     | `readme`, `doc` 含む              |
| `style`    | スタイル         | `css`, `style` 含む               |
| `refactor` | リファクタリング | 削除時                            |
| `test`     | テスト           | `test`, `spec` 含む               |
| `chore`    | 設定・ビルド     | `config`, `vite`, `tsconfig` 含む |

### Scope 生成ルール

| ディレクトリ           | Scope          |
| ---------------------- | -------------- |
| `src/components/`      | `components`   |
| `src/hooks/`           | `hooks`        |
| `src/utils/`           | `utils`        |
| その他単一ディレクトリ | ディレクトリ名 |

### 実例

```bash
# 単一コンポーネント更新
git add src/components/Button.tsx
# → feat(components): Button.tsxを更新

# 複数ファイル更新
git add src/hooks/
# → feat(hooks): 3個のファイルを更新

# 設定ファイル更新
git add vite.config.ts
# → chore: vite.config.tsを更新

# 全変更ステージ
git add -A
# → feat: 5個のファイルを更新
```

### メッセージフォーマット

- **Header**: `{type}({scope}): {description}` (≤65 文字)
- **Body**: 複数ファイル時の詳細 (3 ファイル超過時)
- **言語**: 日本語説明

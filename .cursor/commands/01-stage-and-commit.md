# /stage-commit

Stage specific changes and commit with AI-generated message using Git commands.

## HOW TO USE

- `/stage-commit src/foo.ts` → 指定ファイルをステージ
- `/stage-commit apps/web/**` → ディレクトリ配下をステージ
- `/stage-commit *` → 全変更をステージ
- （⚠️ 引数なしはエラー）

## GIT COMMANDS IMPLEMENTATION

### Step 1: Stage files

```bash
# If args == "*"
git add -A

# Else
git add {provided_args}
```

### Step 2: Show staged files

```bash
git diff --staged --name-status
```

### Step 3: Generate commit message

Based on staged files, create Conventional Commit format:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: スタイル
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: 設定・ビルド

### Step 4: Commit with confirmation

```bash
git commit -m "<header>" -m "<body>"
```

## USAGE EXAMPLES

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

## COMMIT MESSAGE RULES

- Header ≤65 chars
- Format: `type(scope): description`
- Japanese descriptions
- Body for multiple files (>3)

# Tailwind Inspector テストセットアップ

## 📦 テストライブラリのインストール

```bash
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom \
  @types/chrome \
  playwright \
  @playwright/test
```

## ⚙️ 設定ファイル

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

### src/test/setup.ts

```typescript
import "@testing-library/jest-dom";

// Chrome APIのモック
global.chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
  },
} as any;

// localStorage mock
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});
```

## 🎯 テストコマンド

```bash
# ユニットテスト
npm run test:unit

# 結合テスト
npm run test:integration

# E2Eテスト
npm run test:e2e

# 全テスト
npm run test

# カバレッジ付き
npm run test:coverage
```

## 📁 テストディレクトリ構造

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── utils.test.ts
│   │   ├── hooks/
│   │   │   └── useInspector.test.ts
│   │   └── components/
│   │       ├── ToggleButtons.test.tsx
│   │       ├── Legend.test.tsx
│   │       └── Tooltip.test.tsx
│   ├── integration/
│   │   ├── localStorage.test.ts
│   │   ├── app.test.tsx
│   │   └── dom.test.ts
│   └── e2e/
│       ├── extension.test.ts
│       └── user-scenarios.test.ts
├── test/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── chrome.ts
│   │   └── dom.ts
│   └── fixtures/
│       └── sample-elements.html
```

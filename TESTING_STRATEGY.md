# 🧪 Tailwind Inspector テスト戦略 & 実装ガイド

## 📋 概要

Chrome 拡張機能として動作する Tailwind Inspector に対する包括的なテスト戦略です。テストピラミッド構成に基づき、ユニットテスト・結合テスト・E2E テストを段階的に実装します。

## 🎯 テスト戦略

### テストピラミッド構成

```
      🔺 E2E Tests (5-10%)
     ──────────────────────
    📊 Integration Tests (20-30%)
   ────────────────────────────────
  🧪 Unit Tests (70-80%) - 基盤
 ──────────────────────────────────
```

## 🛠️ セットアップ済み環境

### インストール済みライブラリ

```bash
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom
```

### 設定ファイル

- ✅ `vitest.config.ts` - Vitest メイン設定
- ✅ `src/test/setup.ts` - テスト環境セットアップ
- ✅ テストディレクトリ構造

### 利用可能なコマンド

```bash
npm run test              # 全テスト実行
npm run test:unit         # ユニットテストのみ
npm run test:integration  # 結合テストのみ
npm run test:e2e          # E2Eテストのみ
npm run test:coverage     # カバレッジ付き
npm run test:watch        # ウォッチモード
```

## 📊 実装済みテスト

### ✅ 1. ユニットテスト

#### **A. Utils 関数テスト** (`src/__tests__/unit/utils.test.ts`)

- **toSides()**: CSS 値 →Sides 型変換
- **extractTailwindClasses()**: Tailwind クラス抽出
- **toHex()**: 色変換（rgb→hex）
- **escapeHTML()**: HTML エスケープ
- **debounce()**: 関数遅延実行
- **createToast()**: トースト通知作成

#### **B. React Hook テスト** (`src/__tests__/unit/hooks/useInspector.test.ts`)

- **状態管理**: localStorage 統合
- **トグル機能**: enabled/mode/legend 切り替え
- **初期値**: デフォルト値の検証
- **永続化**: localStorage 保存の確認

#### **C. React Component テスト** (`src/__tests__/unit/components/ToggleButtons.test.tsx`)

- **レンダリング**: props 通りの表示
- **ユーザー操作**: クリック・キーボード操作
- **アクセシビリティ**: aria 属性の確認
- **パフォーマンス**: React.memo 動作

### ✅ 2. 結合テスト

#### **A. App 統合テスト** (`src/__tests__/integration/app.test.tsx`)

- **コンポーネント統合**: App + useInspector
- **条件付きレンダリング**: enabled 状態による表示制御
- **localStorage 統合**: 状態の永続化
- **複数状態変更**: 連続操作の整合性

### ✅ 3. E2E テスト（概念実装）

#### **A. ユーザーシナリオ** (`src/__tests__/e2e/user-scenarios.test.ts`)

- **Inspector 完全フロー**: 有効化 → 検査 → 無効化
- **パフォーマンス**: 大量要素での動作
- **エラー回復**: 異常状態からの復旧

## 🚨 発見された問題点 & 修正案

### 現在のテスト結果

- **48 テスト中 35 個成功** ✅
- **13 個失敗** ❌ → 要修正

### 主な修正必要箇所

#### 1. **localStorage Mock 問題**

```typescript
// 問題: テスト環境でlocalStorageが期待通り動作しない
// 修正案: より堅牢なlocalStorageMock実装

// src/test/setup.ts で修正が必要
const localStorageMock = {
  store: new Map(),
  getItem: vi.fn((key) => localStorageMock.store.get(key) || null),
  setItem: vi.fn((key, value) => localStorageMock.store.set(key, value)),
  removeItem: vi.fn((key) => localStorageMock.store.delete(key)),
  clear: vi.fn(() => localStorageMock.store.clear()),
};
```

#### 2. **useInspector 初期値問題**

```typescript
// 問題: デフォルト値がテストで期待値と異なる
// 修正案: localStorage読み込みロジックの見直し

// src/hooks/useInspector.ts
const [enabled, setEnabled] = useState(() => {
  try {
    const stored = localStorage.getItem("ti-enabled");
    return stored === null ? true : stored === "true";
  } catch {
    return true; // フォールバック
  }
});
```

#### 3. **React import 問題**

```typescript
// 問題: React.memoでReactが未定義
// 修正案: import文の追加

// src/__tests__/unit/components/ToggleButtons.test.tsx
import React from "react";
```

#### 4. **キーボードイベント処理**

```typescript
// 問題: keyDownイベントがclickイベントをトリガーしない
// 修正案: keyDownハンドラーの追加またはテスト方法の変更

// ToggleButtonsコンポーネントでonKeyDown追加か
// テストでfireEvent.clickを直接使用
```

## 📈 テストカバレッジ目標

### 現在の状況

- **Utils 関数**: ~95% ✅
- **Hooks**: ~70% ⚠️ (localStorage 統合で課題)
- **Components**: ~85% ✅
- **Integration**: ~60% ⚠️

### 目標カバレッジ

- **ユニットテスト**: 90%以上
- **結合テスト**: 80%以上
- **全体**: 85%以上

## 🔄 継続的改善プラン

### Phase 1: 基盤修正 ⏱️ 1-2 日

1. localStorage Mock 修正
2. useInspector 初期値バグ修正
3. React import 問題解決
4. 基本テストケース安定化

### Phase 2: カバレッジ向上 ⏱️ 3-5 日

1. Edge case 追加
2. エラーハンドリングテスト強化
3. パフォーマンステスト実装
4. アクセシビリティテスト追加

### Phase 3: E2E 拡張 ⏱️ 1 週間

1. Playwright 導入
2. Chrome 拡張機能 E2E テスト
3. 実際の Web ページでのテスト
4. CI/CD 統合

## 🎁 今後の拡張可能性

### Advanced Testing

- **Visual Regression Testing**: ビジュアル変更の検出
- **Performance Testing**: メモリ使用量・実行時間測定
- **Cross-browser Testing**: 複数ブラウザでの動作確認
- **Accessibility Testing**: WAI-ARIA 準拠度チェック

### Test Automation

- **GitHub Actions**: CI/CD パイプライン
- **Pre-commit Hooks**: コミット前テスト実行
- **Coverage Gates**: カバレッジしきい値強制
- **Regression Detection**: 既存機能破損の早期発見

## 📚 参考リソース

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/tut_debugging/)
- [React Testing Patterns](https://react-hooks-testing-library.com/)

---

## 🚀 次のステップ

1. **即座の修正**: localStorage Mock + 初期値問題
2. **テスト安定化**: 全テストケースの成功
3. **カバレッジ向上**: 追加テストケース実装
4. **E2E 導入**: Playwright 環境セットアップ
5. **CI/CD 統合**: 自動テスト実行環境構築

このテスト戦略により、Tailwind Inspector の品質向上と安定した開発サイクルを実現できます。

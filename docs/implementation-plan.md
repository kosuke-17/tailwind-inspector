# Tailwind Inspector 機能実装計画書

## 概要
SPEC.mdに記載された「今後の拡張（提案）」を基に、具体的な実装計画を策定します。
現在の実装はHoverモードのツールチップ表示のみですが、以下の機能拡張により本格的なTailwind CSS デバッグツールとして完成させます。

## 実装優先度
1. **優先度 高**: Hover モードのリング描画
2. **優先度 高**: All モードの実装
3. **優先度 中**: Background スクリプトの整理
4. **優先度 中**: 軽量化・最適化

---

## 1. All モード実装計画

### 概要
ページ内の全要素に対してpadding/margin/gapを可視化し、レイアウト構造を一目で把握できる機能を実装します。

### 現状分析
- `useInspector.ts`の`buildGlobal()`はプレースホルダのみ
- `old_content.js`に旧実装のアルゴリズムが存在
- `utils.ts`に必要なヘルパー関数は実装済み

### 実装ステップ

#### 1.1 要素収集・フィルタリング機能
**ファイル**: `src/hooks/useInspector.ts`

```typescript
// 実装する関数
const collectVisibleElements = (): Element[] => {
  // old_content.jsの logic を移植
  // - 可視要素のみを収集
  // - MAX_ELEMENTS 制限の適用
  // - 重複除去とフィルタリング
}

const filterElementsByType = (elements: Element[]): {
  paddingElements: Element[],
  marginElements: Element[],
  gapElements: Element[]
} => {
  // 各要素のスタイルを検査してカテゴリ分け
}
```

**タスク**:
- [ ] `old_content.js`の要素収集ロジックを解析
- [ ] TypeScript/Reactに適合する形で移植
- [ ] パフォーマンス制限（MAX_ELEMENTS）の実装

#### 1.2 レイアウト計測・グルーピング
**ファイル**: `src/utils.ts`, `src/hooks/useInspector.ts`

```typescript
// 拡張する関数
const groupElementsByLayout = (elements: Element[]): ElementGroup[] => {
  // utils.ts の groupBy を活用
  // ROW_EPS, COL_EPS を使った近似グルーピング
}

const calculateGapSegments = (container: Element): GapSegment[] => {
  // Gap表示用のセグメント計算
  // MAX_GAP_SEGMENTS による制限
}
```

**タスク**:
- [ ] 既存の`groupBy`関数の拡張
- [ ] Gap検出アルゴリズムの実装
- [ ] レイアウト情報の効率的な計算

#### 1.3 描画エンジンの実装
**ファイル**: `src/components/GlobalOverlay.tsx`（新規作成）

```typescript
interface GlobalOverlayProps {
  elements: ElementGroup[];
  globalLayerRef: React.RefObject<HTMLDivElement>;
}

const GlobalOverlay: React.FC<GlobalOverlayProps> = ({ elements, globalLayerRef }) => {
  // SVG または Canvas を使った高性能描画
  // Padding/Margin/Gap の可視化
  // 色分け・透明度の管理
}
```

**タスク**:
- [ ] SVGベースの描画コンポーネント作成
- [ ] レスポンシブ対応（resize/scroll対応）
- [ ] カラーテーマの統一（Legend.tsxとの整合性）

#### 1.4 イベント処理の拡張
**ファイル**: `src/hooks/useInspector.ts`

```typescript
const buildGlobal = useCallback(() => {
  if (!inspectorMode || !enabled) return;
  
  const elements = collectVisibleElements();
  const grouped = groupElementsByLayout(elements);
  setGlobalOverlayData(grouped);
}, [inspectorMode, enabled]);

// イベントハンドラの拡張
useEffect(() => {
  // MutationObserver の詳細設定
  // スクロール・リサイズの最適化
}, [inspectorMode]);
```

**タスク**:
- [ ] デバウンス処理の実装
- [ ] MutationObserver の最適化
- [ ] メモリリーク対策

### 完了基準
- [ ] ページ内全要素のpadding/margin/gapが可視化される
- [ ] スクロール・リサイズに適切に追従する
- [ ] パフォーマンスが許容範囲内（描画60fps維持）

---

## 2. Hover モードのリング描画実装計画

### 概要
現在のツールチップに加えて、ホバー要素の周囲にpadding/margin の境界線を表示する機能を実装します。

### 現状分析
- ツールチップ表示は完成
- リング描画機能は未実装
- `old_content.js`に描画ロジックの参考実装あり

### 実装ステップ

#### 2.1 リング描画コンポーネント
**ファイル**: `src/components/HoverRing.tsx`（新規作成）

```typescript
interface HoverRingProps {
  targetElement: Element | null;
  tooltipData: TooltipData | null;
  visible: boolean;
}

const HoverRing: React.FC<HoverRingProps> = ({ targetElement, tooltipData, visible }) => {
  // 要素の getBoundingClientRect() を基に描画
  // Padding/Margin 境界のアウトライン表示
  // サイドラベル（数値表示）
}
```

**実装詳細**:
- 絶対位置指定によるオーバーレイ
- CSS borders または SVG による境界線描画
- 動的な色分け（padding: 青、margin: オレンジなど）

#### 2.2 サイドラベル機能
**ファイル**: `src/components/SideLabels.tsx`（新規作成）

```typescript
interface SideLabelsProps {
  bounds: DOMRect;
  padding: Sides;
  margin: Sides;
  minThickness: number; // MIN_LABEL_THICKNESS
}

const SideLabels: React.FC<SideLabelsProps> = ({ bounds, padding, margin, minThickness }) => {
  // 上下左右の数値ラベルを適切な位置に配置
  // 最小厚さ以下の場合は非表示
}
```

#### 2.3 統合とイベント処理
**ファイル**: `src/hooks/useInspector.ts`, `src/App.tsx`

```typescript
// useInspector.ts に追加
const [hoverElement, setHoverElement] = useState<Element | null>(null);

// App.tsx に追加
{!inspectorMode && hoverElement && (
  <HoverRing 
    targetElement={hoverElement}
    tooltipData={tooltipData}
    visible={tooltipVisible}
  />
)}
```

### 完了基準
- [ ] ホバー要素の周囲にpadding/margin境界が表示される
- [ ] 数値ラベルが適切な位置に表示される
- [ ] スクロール時に追従する
- [ ] 既存のツールチップと連携する

---

## 3. Background スクリプト整理計画

### 概要
現在未使用のbackground.tsの取り扱いを決定し、必要に応じて実装を完了するか除去します。

### 現状分析
- `src/background.ts`は実装済みだがManifest未登録
- localStorage使用だがMV3 Service Workerでは非対応
- 実際の使用用途が不明確

### 選択肢と推奨案

#### 案A: Background Script の完全実装（推奨）
**用途**: Chrome Extension API の活用

```json
// manifest.json
{
  "background": {
    "service_worker": "dist/background.js",
    "type": "module"
  }
}
```

```typescript
// src/background.ts の改修
chrome.storage.sync を使用した設定の永続化
chrome.tabs API を使った高度な機能
chrome.action による拡張アイコンとの連携
```

**実装タスク**:
- [ ] chrome.storage.sync への移行
- [ ] Content Script ↔ Background間の通信設計
- [ ] アイコンクリック時の動作定義

#### 案B: Background Script の除去（簡易）
**理由**: 現在の機能にBackgroundは不要

**実装タスク**:
- [ ] `src/background.ts` の削除
- [ ] `vite.config.ts` からビルド設定除去
- [ ] tsconfig.json の調整

### 推奨決定
**案A を採用**: 将来の機能拡張性を考慮し、chrome.storage.sync による設定管理を実装

---

## 4. 軽量化・最適化実装計画

### 概要
パフォーマンスとユーザビリティの向上を目的とした最適化施策を実装します。

### 実装項目

#### 4.1 イベント処理の最適化
**ファイル**: `src/hooks/useInspector.ts`

```typescript
// デバウンス・スロットリングの実装
const useThrottledCallback = (callback: Function, delay: number) => {
  // throttle implementation
};

const useDebouncedCallback = (callback: Function, delay: number) => {
  // debounce implementation  
};

// 適用箇所
const throttledMouseMove = useThrottledCallback(handleMouseMove, 16); // 60fps
const debouncedResize = useDebouncedCallback(buildGlobal, 100);
```

#### 4.2 レンダリング最適化
**ファイル**: `src/components/` 全般

```typescript
// React.memo の適用
const Tooltip = React.memo<TooltipProps>(({ ... }) => {
  // component implementation
});

// useMemo の活用
const computedStyles = useMemo(() => {
  return heavyComputation(tooltipData);
}, [tooltipData]);
```

#### 4.3 DOM操作の最小化
**ファイル**: `src/hooks/useInspector.ts`

```typescript
// 仮想化・差分更新
const useVirtualizedElements = (elements: Element[]) => {
  // viewport内の要素のみ処理
  // 前回との差分のみ更新
};
```

#### 4.4 バンドルサイズ最適化
**ファイル**: `vite.config.ts`

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 適切なチャンク分割
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      // 最適化設定
    }
  }
});
```

### パフォーマンス目標
- [ ] ページ読み込み影響: < 100ms
- [ ] ホバー応答性: < 16ms（60fps）
- [ ] All モード描画: < 500ms
- [ ] バンドルサイズ: < 200KB

---

## 実装順序とマイルストーン

### Phase 1: 基本機能の完成（2-3週間）
1. Hover モードのリング描画実装
2. Background スクリプトの整理
3. 基本的な最適化

### Phase 2: 高度な機能実装（3-4週間）
1. All モードの実装
2. 高度な最適化施策
3. 総合テストとバグ修正

### Phase 3: 品質向上とリリース準備（1-2週間）
1. パフォーマンス最適化
2. アクセシビリティ対応
3. ドキュメント整備

## リスク分析

### 技術リスク
- **All モードのパフォーマンス**: 大量DOM要素でのレンダリング負荷
- **ブラウザ互換性**: Chrome Extension MV3の制約
- **メモリ使用量**: 長時間使用時のメモリリーク

### 対策
- 段階的実装とプロトタイピング
- 早期テストとベンチマーク
- コードレビューとペアプログラミング

## 成功指標

### 機能面
- [ ] 全ての拡張提案機能が動作する
- [ ] 既存機能に影響がない
- [ ] Chrome Web Storeの審査をパスする

### 品質面
- [ ] TypeScript型安全性100%
- [ ] ユニットテストカバレッジ > 80%
- [ ] ユーザビリティテスト合格

### パフォーマンス面
- [ ] 上記設定した各目標値の達成
- [ ] 実際のWebサイトでの動作検証完了

この実装計画により、Tailwind Inspectorを本格的なデバッグツールとして完成させることができます。
# 🏗️ Tailwind Inspector DDD リファクタリング計画

## 📋 現状分析と目標

### **現在の問題点**

- **ロジック散在**: `useInspector.ts` に DOM 操作・状態管理・ビジネスロジックが混在（380 行）
- **Chrome 依存**: UI コンポーネントから直接 `localStorage` や DOM API を呼び出し
- **テスト困難**: ビジネスロジックが React Hook に埋め込まれ、単体テストが複雑
- **責任曖昧**: Tailwind 解析・可視化・競合解決の境界が不明確

### **DDD リファクタリング目標**

- **Core 層**: Tailwind 解析・スタイル競合解決・可視化計画を純粋なドメインロジックに隔離
- **Port/Adapter**: Chrome API・DOM 操作・ストレージを抽象化
- **React 専任**: UI は描画とイベント処理のみに集中
- **テスト品質**: Core 層 80%以上のカバレッジ、境界テストの充実

---

## 🎯 ターゲットアーキテクチャ

### **レイヤード構造**

```
src/
├── core/                           # 純粋ドメイン（React/Chrome非依存）
│   ├── domain/
│   │   ├── model/                  # 値オブジェクト・エンティティ
│   │   │   ├── TailwindClass.ts    # クラス名の値オブジェクト
│   │   │   ├── ElementMetrics.ts   # 要素の位置・サイズ情報
│   │   │   ├── StyleProperty.ts    # CSS プロパティ値
│   │   │   ├── VisualizationSpec.ts # 可視化仕様
│   │   │   └── InspectorConfig.ts  # Inspector設定
│   │   ├── policy/
│   │   │   ├── ConflictResolution.ts # CSS競合解決ルール
│   │   │   └── VisualizationPolicy.ts # 表示優先度・色決定
│   │   └── service/
│   │       ├── TailwindParser.ts   # className -> TailwindClass[]
│   │       ├── StyleResolver.ts    # TailwindClass[] -> ComputedStyle
│   │       └── VisualizationPlanner.ts # ComputedStyle -> VisualizationSpec
│   ├── application/
│   │   ├── ports/                  # インターフェース抽象
│   │   │   ├── DomReaderPort.ts    # 要素情報取得
│   │   │   ├── OverlayRendererPort.ts # 可視化描画
│   │   │   ├── ConfigStoragePort.ts # 設定永続化
│   │   │   └── NotificationPort.ts # ユーザー通知
│   │   └── usecase/
│   │       ├── InspectElement.ts   # 要素検査の主要フロー
│   │       ├── ToggleVisualization.ts # 可視化ON/OFF
│   │       ├── UpdateConfig.ts     # 設定変更
│   │       └── PlanHighlight.ts    # ハイライト計画
│   └── shared/
│       ├── Result.ts               # Either型（エラーハンドリング）
│       ├── ValueObject.ts          # 値オブジェクト基底
│       └── DomainEvent.ts          # イベント基盤
├── infrastructure/                 # 具体実装
│   ├── dom/
│   │   ├── DomElementReader.ts     # implements DomReaderPort
│   │   └── OverlayCanvasRenderer.ts # implements OverlayRendererPort
│   ├── storage/
│   │   └── LocalStorageAdapter.ts  # implements ConfigStoragePort
│   └── notification/
│       └── ToastNotifier.ts        # implements NotificationPort
├── interface/                      # プレゼンテーション層
│   ├── components/                 # React コンポーネント
│   │   ├── InspectorPanel.tsx      # メイン UI
│   │   ├── ToggleButtons.tsx       # 制御ボタン群
│   │   ├── Legend.tsx              # 凡例表示
│   │   └── Tooltip.tsx             # ツールチップ
│   ├── hooks/
│   │   ├── useInspectorController.ts # UseCase オーケストレーション
│   │   └── useConfigState.ts       # 設定状態管理
│   └── presenters/
│       └── VisualizationPresenter.ts # Domain -> ViewModel 変換
├── platform/extension/             # Chrome拡張機能コンテキスト
│   ├── content/
│   │   └── index.ts                # Content Script の Composition Root
│   ├── background/
│   │   └── index.ts                # Background Script
│   └── popup/
│       └── index.ts                # Popup の Composition Root
└── config/
    ├── di.ts                       # 依存性注入設定
    └── boundaries.eslintrc.js      # レイヤー境界ルール
```

---

## 🔄 段階的移行計画

### **Phase 1: ドメインモデル抽出 (1-2 週間)**

#### **Step 1.1: 値オブジェクト定義**

```typescript
// core/domain/model/TailwindClass.ts
export class TailwindClass {
  constructor(
    private readonly value: string,
    private readonly variant?: string,
    private readonly modifier?: string
  ) {}

  static parse(className: string): TailwindClass[] {
    // 既存の extractTailwindClasses ロジックを移行
  }

  get cssProperty(): string {
    /* 実装 */
  }
  get priority(): number {
    /* 実装 */
  }
}

// core/domain/model/ElementMetrics.ts
export class ElementMetrics {
  constructor(
    public readonly bounds: DOMRect,
    public readonly computedStyle: CSSStyleDeclaration
  ) {}

  get boxModel(): BoxModel {
    /* padding/margin/border 計算 */
  }
}
```

#### **Step 1.2: 既存 utils.ts からの移行**

- `extractTailwindClasses` → `TailwindClass.parse()`
- `toSides` → `ElementMetrics.boxModel`
- `toHex` → `StyleProperty.normalizeColor()`

#### **Step 1.3: 単体テストの充実**

```typescript
// core/__tests__/domain/model/TailwindClass.test.ts
describe("TailwindClass", () => {
  it("should parse responsive variants correctly", () => {
    const classes = TailwindClass.parse("sm:p-4 lg:bg-red-500");
    expect(classes).toHaveLength(2);
    expect(classes[0].variant).toBe("sm");
    expect(classes[0].cssProperty).toBe("padding");
  });
});
```

### **Phase 2: サービス層分離 (2-3 週間)**

#### **Step 2.1: パーサー実装**

```typescript
// core/domain/service/TailwindParser.ts
export class TailwindParser {
  parse(classAttribute: string): TailwindClass[] {
    return TailwindClass.parse(classAttribute);
  }

  categorize(classes: TailwindClass[]): ClassificationMap {
    // layout, color, typography 等に分類
  }
}
```

#### **Step 2.2: スタイル競合解決**

```typescript
// core/domain/service/StyleResolver.ts
export class StyleResolver {
  constructor(private policy: ConflictResolutionPolicy) {}

  resolve(classes: TailwindClass[]): ComputedStyleMap {
    // 優先度順ソート → 競合解決 → 最終値決定
  }
}

// core/domain/policy/ConflictResolution.ts
export class ConflictResolutionPolicy {
  resolve(conflicts: TailwindClass[]): TailwindClass {
    // !important > variant specificity > source order
  }
}
```

#### **Step 2.3: 可視化計画**

```typescript
// core/domain/service/VisualizationPlanner.ts
export class VisualizationPlanner {
  plan(style: ComputedStyleMap, metrics: ElementMetrics): VisualizationSpec {
    return new VisualizationSpec({
      padding: this.planPaddingOverlay(style.padding, metrics),
      margin: this.planMarginOverlay(style.margin, metrics),
      labels: this.planLabels(style, metrics),
    });
  }
}
```

### **Phase 3: Port/Adapter パターン (2 週間)**

#### **Step 3.1: ポート定義**

```typescript
// core/application/ports/DomReaderPort.ts
export interface DomReaderPort {
  getElementMetrics(selector: string): Result<ElementMetrics, DomError>;
  getComputedStyle(element: Element): CSSStyleDeclaration;
  findElementAt(x: number, y: number): Element | null;
}

// core/application/ports/OverlayRendererPort.ts
export interface OverlayRendererPort {
  render(spec: VisualizationSpec): void;
  clear(): void;
  setVisibility(visible: boolean): void;
}
```

#### **Step 3.2: DOM アダプター実装**

```typescript
// infrastructure/dom/DomElementReader.ts
export class DomElementReader implements DomReaderPort {
  getElementMetrics(selector: string): Result<ElementMetrics, DomError> {
    try {
      const element = document.querySelector(selector);
      if (!element) return Result.failure(new DomError("Element not found"));

      return Result.success(
        new ElementMetrics(
          element.getBoundingClientRect(),
          getComputedStyle(element)
        )
      );
    } catch (error) {
      return Result.failure(new DomError(error.message));
    }
  }
}
```

### **Phase 4: UseCase 実装 (1-2 週間)**

#### **Step 4.1: 中核ユースケース**

```typescript
// core/application/usecase/InspectElement.ts
export class InspectElement {
  constructor(
    private domReader: DomReaderPort,
    private renderer: OverlayRendererPort,
    private parser: TailwindParser,
    private resolver: StyleResolver,
    private planner: VisualizationPlanner
  ) {}

  async execute(
    target: string
  ): Promise<Result<VisualizationSpec, InspectionError>> {
    const metricsResult = await this.domReader.getElementMetrics(target);
    if (metricsResult.isFailure()) {
      return Result.failure(new InspectionError("Failed to read element"));
    }

    const classes = this.parser.parse(metricsResult.value.classAttribute);
    const styles = this.resolver.resolve(classes);
    const spec = this.planner.plan(styles, metricsResult.value);

    this.renderer.render(spec);
    return Result.success(spec);
  }
}
```

#### **Step 4.2: 設定管理ユースケース**

```typescript
// core/application/usecase/UpdateConfig.ts
export class UpdateConfig {
  constructor(private storage: ConfigStoragePort) {}

  async toggleInspector(): Promise<boolean> {
    const config = await this.storage.load();
    config.enabled = !config.enabled;
    await this.storage.save(config);
    return config.enabled;
  }
}
```

### **Phase 5: React 層リファクタリング (1-2 週間)**

#### **Step 5.1: Hook の責任分離**

```typescript
// interface/hooks/useInspectorController.ts
export const useInspectorController = () => {
  const [config, setConfig] = useState<InspectorConfig>();
  const inspectUseCase = useInspectElement(); // DI から取得
  const configUseCase = useUpdateConfig(); // DI から取得

  const handleInspect = useCallback(
    async (target: string) => {
      const result = await inspectUseCase.execute(target);
      if (result.isFailure()) {
        // エラーハンドリング
      }
    },
    [inspectUseCase]
  );

  const toggleEnabled = useCallback(async () => {
    const newState = await configUseCase.toggleInspector();
    setConfig((prev) => ({ ...prev, enabled: newState }));
  }, [configUseCase]);

  return { config, handleInspect, toggleEnabled };
};
```

#### **Step 5.2: Composition Root**

```typescript
// platform/extension/content/index.ts
import { createDependencyContainer } from "../../../config/di";

const container = createDependencyContainer();

// React アプリケーションにコンテナを注入
const App = () => (
  <DependencyProvider container={container}>
    <InspectorPanel />
  </DependencyProvider>
);
```

### **Phase 6: テスト強化 & 境界保護 (1 週間)**

#### **Step 6.1: レイヤー境界の ESLint ルール**

```javascript
// config/boundaries.eslintrc.js
module.exports = {
  rules: {
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          {
            target: "./src/core/**/*",
            from: "./src/infrastructure/**/*",
            message: "Core layer cannot depend on Infrastructure",
          },
          {
            target: "./src/core/**/*",
            from: "./src/interface/**/*",
            message: "Core layer cannot depend on UI layer",
          },
        ],
      },
    ],
  },
};
```

#### **Step 6.2: 契約テスト**

```typescript
// infrastructure/__tests__/dom/DomElementReader.contract.test.ts
describe("DomElementReader Contract", () => {
  it("should implement DomReaderPort correctly", () => {
    const reader = new DomElementReader();

    // Port の契約に従った動作をテスト
    expect(reader.getElementMetrics).toBeDefined();
    expect(reader.findElementAt).toBeDefined();
  });
});
```

---

## 📊 移行スケジュール

| Phase       | 期間     | 主要成果物     | 完了判定基準                            |
| ----------- | -------- | -------------- | --------------------------------------- |
| **Phase 1** | 1-2 週間 | ドメインモデル | `core/domain/model/` の単体テスト 90%+  |
| **Phase 2** | 2-3 週間 | サービス層     | Parser/Resolver/Planner の分岐網羅 80%+ |
| **Phase 3** | 2 週間   | Port/Adapter   | 全ての Port に対する Adapter 実装完了   |
| **Phase 4** | 1-2 週間 | UseCase        | 主要 UseCase の動作確認                 |
| **Phase 5** | 1-2 週間 | React 層       | UI からの直接 DOM/Chrome API 削除       |
| **Phase 6** | 1 週間   | 境界保護       | ESLint ルール適用、契約テスト           |

**総期間: 7-12 週間**

---

## 🎯 完了判定基準

### **アーキテクチャ品質**

- [ ] `core/` から `infrastructure/` への依存 **ゼロ**
- [ ] React コンポーネントから `document`/`localStorage` 直接アクセス **ゼロ**
- [ ] UseCase 1 つあたり **200 行以内**、依存数 **5 個以内**

### **テスト品質**

- [ ] Core 層の分岐網羅率 **80%以上**
- [ ] 全 Port に対する契約テスト **100%**
- [ ] E2E テストの成功率 **95%以上**

### **保守性**

- [ ] 新機能追加時の影響範囲が **1-2 レイヤー以内**
- [ ] PR レビュー時間の **50%短縮**
- [ ] ビジネスロジックの理解容易性向上

---

## 🚨 リスク管理

### **技術リスク**

- **Over-Engineering**: DDD が重すぎて開発速度低下
  - **対策**: MVP 機能のみに適用、段階的拡張
- **テスト負荷**: Mock 作成コストの増大
  - **対策**: Test Builder パターン、ファクトリー関数活用

### **チームリスク**

- **学習コスト**: DDD 概念の理解不足
  - **対策**: ペアプログラミング、コードレビュー強化
- **移行コスト**: 大幅リファクタリングによる機能停止
  - **対策**: Feature Flag、Strangler Fig パターン

### **スケジュールリスク**

- **見積もり甘さ**: 複雑性の過小評価
  - **対策**: 2 週間スプリント、早期フィードバック
- **仕様変更**: 途中での要件追加
  - **対策**: Port/Adapter で変更を局所化

---

## 📈 期待効果

### **短期効果 (1-3 ヶ月)**

- ビジネスロジックの単体テスト可能化
- React コンポーネントの責任明確化
- Chrome API 変更への耐性向上

### **中期効果 (3-6 ヶ月)**

- 新機能開発速度の向上
- バグ発生率の低下
- コードレビュー効率化

### **長期効果 (6 ヶ月+)**

- 技術的負債の大幅削減
- 他の Chrome 拡張への DDD パターン適用
- チーム全体の設計スキル向上

---

## 🛠️ 実装開始準備

### **事前準備**

1. **用語集作成**: ユビキタス言語の定義（README.md に追加）
2. **現行分析**: 既存 `useInspector.ts` の詳細責任分析
3. **テスト戦略**: 移行中のリグレッション防止策

### **初回 PR 候補**

- `TailwindClass` 値オブジェクト作成
- `extractTailwindClasses` → `TailwindClass.parse` 移行
- 対応する単体テスト追加

**準備完了の合図をいただければ、初回 PR の具体的な差分とマイルストーンを詳細化します！**

いいね、では**Chrome 拡張 × React × Vitest**前提で、DDD の“骨だけ”をレイヤードに落としていく**実務向けリファクタ戦略**を一気に固めます。
（AI が盛った“謎クラス”は、境界で丁寧に水切りします 🍝）

# 0) 目的（スコープ）

- **UI に散らばったロジック**（Tailwind 解析・競合解決・可視化計画）を**Core 層**へ隔離
- **Chrome/DOM 依存**は**Ports/Adapters**に押し込み、**React は描画専任**へ
- **ユニットテストは Core 80%↑**、周辺は契約テスト＆薄い結合テスト

---

# 1) ディレクトリ（レイヤード＋ポート/アダプタ）

```
src/
  core/                      # ← React/Chromeを知らない“純ドメイン”
    domain/
      model/                 # 値オブジェクト/エンティティ
        TailwindClass.ts
        TargetElementId.ts
        ResolvedStyle.ts
        HighlightSpec.ts
      policy/
        ConflictPolicy.ts    # 競合解決ルール
      service/
        TailwindParser.ts    # "class attr" -> TailwindClass[]
        StyleResolver.ts     # TailwindClass[] -> ResolvedStyle
        HighlightPlanner.ts  # ResolvedStyle -> HighlightSpec
    application/
      ports/                 # I/Oの抽象
        DomReaderPort.ts         # getClassAttr, getBoxMetrics, …
        OverlayWriterPort.ts     # drawOverlay, clear, …
        MessagingPort.ts         # send/subscribe
        StoragePort.ts           # load/save settings
        TailwindPresetPort.ts    # プリセット/テーマ取得
      usecase/
        InspectElement.ts
        PlanHighlight.ts
        ToggleOverlay.ts
        UpdatePolicy.ts
    shared/
      Result.ts              # Either/Option等（軽量でOK）
      types.ts
  infrastructure/            # 具体アダプタ（Chrome/DOM/Storageなど）
    dom/
      DomReader.ts           # implements DomReaderPort
      OverlayCanvas.ts       # implements OverlayWriterPort
    chrome/
      ChromeMessaging.ts     # implements MessagingPort
      ChromeStorage.ts       # implements StoragePort
    tailwind/
      TailwindPresetFile.ts  # implements TailwindPresetPort
  interface/                 # プレゼンテーション（React）
    components/
      Panel.tsx
      OverlayRoot.tsx
    hooks/
      useInspect.ts
    presenters/
      specToVm.ts            # Domain -> ViewModel
  platform/extension/        # アプリの“殻” (各コンテキストの composition root)
    content/index.ts         # DI: DomReader + Messaging + usecase wiring
    background/index.ts
    devtools/index.tsx
    popup/index.tsx
  config/
    di.ts                    # 依存グラフ構築ヘルパ
    boundaries.eslintrc.cjs  # レイヤ境界ルール
  tests/
    core/…                   # Vitest（ユニット中心）
    contract/…               # Portの契約テスト
```

**原則**

- `core/` は **React/Chrome を一切 import しない**
- `application/ports` は **型だけ**。UI/DOM の具体は `infrastructure` へ
- `platform/extension/*` が **Composition Root**（依存性注入の入口）

---

# 2) ポート定義（最小）

```ts
// core/application/ports/DomReaderPort.ts
export interface DomReaderPort {
  getClassAttr(elId: string): string;
  getBoxMetrics(elId: string): { x: number; y: number; w: number; h: number };
}

// core/application/ports/OverlayWriterPort.ts
export interface OverlayWriterPort {
  draw(spec: {
    rect: { x: number; y: number; w: number; h: number };
    label: string;
  }): void;
  clear(): void;
}
```

---

# 3) ユースケース（Core は“純粋”で保つ）

```ts
// core/application/usecase/InspectElement.ts
import { DomReaderPort } from "../ports/DomReaderPort";
import { OverlayWriterPort } from "../ports/OverlayWriterPort";
import { TailwindParser } from "../../domain/service/TailwindParser";
import { StyleResolver } from "../../domain/service/StyleResolver";
import { HighlightPlanner } from "../../domain/service/HighlightPlanner";

export class InspectElement {
  constructor(
    private dom: DomReaderPort,
    private overlay: OverlayWriterPort,
    private parse: TailwindParser,
    private resolve: StyleResolver,
    private plan: HighlightPlanner
  ) {}

  execute = (elId: string) => {
    const classes = this.parse.parse(this.dom.getClassAttr(elId));
    const style = this.resolve.resolve(classes);
    const spec = this.plan.plan(style, this.dom.getBoxMetrics(elId));
    this.overlay.draw(spec);
    return spec; // テストしやすさのため返す
  };
}
```

---

# 4) インフラ実装（境界の“水切り”）

```ts
// infrastructure/dom/DomReader.ts
import { DomReaderPort } from "../../core/application/ports/DomReaderPort";

export class DomReader implements DomReaderPort {
  getClassAttr(elId: string): string {
    const el = document.getElementById(elId);
    return el?.getAttribute("class") ?? "";
  }
  getBoxMetrics(elId: string) {
    const el = document.getElementById(elId);
    const r = el?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0, w: 0, h: 0 };
    return {
      x: r.x + window.scrollX,
      y: r.y + window.scrollY,
      w: r.width,
      h: r.height,
    };
  }
}
```

```ts
// infrastructure/dom/OverlayCanvas.ts
import { OverlayWriterPort } from "../../core/application/ports/OverlayWriterPort";

export class OverlayCanvas implements OverlayWriterPort {
  private layer = this.ensureLayer();
  draw(spec: {
    rect: { x: number; y: number; w: number; h: number };
    label: string;
  }) {
    const { rect } = spec;
    Object.assign(this.layer.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.w}px`,
      height: `${rect.h}px`,
      display: "block",
    });
    this.layer.textContent = spec.label;
  }
  clear() {
    this.layer.style.display = "none";
  }

  private ensureLayer(): HTMLDivElement {
    let el = document.getElementById("__twviz_overlay__") as HTMLDivElement;
    if (!el) {
      el = document.createElement("div");
      el.id = "__twviz_overlay__";
      Object.assign(el.style, {
        position: "absolute",
        outline: "2px dashed",
        pointerEvents: "none",
        zIndex: "2147483647",
        font: "12px/1.4 ui-monospace, SFMono-Regular, Menlo",
        background: "rgba(0,0,0,0.5)",
        color: "white",
        padding: "2px 4px",
      });
      document.body.appendChild(el);
    }
    return el;
  }
}
```

---

# 5) Composition Root（各コンテキストで注入）

```ts
// platform/extension/content/index.ts
import { DomReader } from "../../infrastructure/dom/DomReader";
import { OverlayCanvas } from "../../infrastructure/dom/OverlayCanvas";
import { InspectElement } from "../../core/application/usecase/InspectElement";
import { TailwindParser } from "../../core/domain/service/TailwindParser";
import { StyleResolver } from "../../core/domain/service/StyleResolver";
import { HighlightPlanner } from "../../core/domain/service/HighlightPlanner";
import { defaultConflictPolicy } from "../../core/domain/policy/ConflictPolicy";

const dom = new DomReader();
const overlay = new OverlayCanvas();
const parser = new TailwindParser();
const resolver = new StyleResolver(defaultConflictPolicy);
const planner = new HighlightPlanner();

const inspect = new InspectElement(dom, overlay, parser, resolver, planner);

// 例: 背景やdevtoolsからメッセージで実行
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "inspect" && msg.elId) inspect.execute(msg.elId);
});
```

---

# 6) React 側（描画専任・ユースケース呼び出し）

```tsx
// interface/components/Panel.tsx
import { useState } from "react";

export function Panel() {
  const [elId, setElId] = useState("");
  const onInspect = () =>
    chrome.tabs?.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "inspect", elId });
    });

  return (
    <div className='p-3 space-y-2'>
      <input
        value={elId}
        onChange={(e) => setElId(e.target.value)}
        placeholder='element id'
      />
      <button onClick={onInspect}>Inspect</button>
    </div>
  );
}
```

---

# 7) テスト戦略（Vitest）

**優先: core/**

- `TailwindParser.test.ts`：字句/正規化/Variant の切り出し
- `StyleResolver.test.ts`：競合テーブル（最後勝ち/!important/variant 優先）を表で網羅
- `HighlightPlanner.test.ts`：Rect→ ガイド線/ラベルの算出

**ユースケース（Fake Port）**

```ts
import { describe, it, expect, vi } from "vitest";
import { InspectElement } from "../../core/application/usecase/InspectElement";

it("inspects and draws", () => {
  const dom = {
    getClassAttr: vi.fn().mockReturnValue("p-4 bg-red-500"),
    getBoxMetrics: vi.fn().mockReturnValue({ x: 10, y: 20, w: 100, h: 50 }),
  };
  const overlay = { draw: vi.fn(), clear: vi.fn() };
  const parser = {
    parse: vi.fn().mockReturnValue([{ value: "p-4" }, { value: "bg-red-500" }]),
  };
  const resolver = {
    resolve: vi.fn().mockReturnValue({ padding: 16, color: "#f00" }),
  };
  const planner = {
    plan: vi
      .fn()
      .mockReturnValue({
        rect: { x: 10, y: 20, w: 100, h: 50 },
        label: "p-4 • bg-red-500",
      }),
  };

  const uc = new InspectElement(
    dom as any,
    overlay as any,
    parser as any,
    resolver as any,
    planner as any
  );
  const spec = uc.execute("el-1");

  expect(overlay.draw).toHaveBeenCalledWith({
    rect: { x: 10, y: 20, w: 100, h: 50 },
    label: "p-4 • bg-red-500",
  });
  expect(spec.label).toContain("p-4");
});
```

**契約テスト（Port 実装）**

- `DomReader.contract.test.ts`：JSDOM/happy-dom で id → class/rect の取得を検証
- `OverlayCanvas.contract.test.ts`：初回生成/再利用/clear のスタイル検証
- `ChromeMessaging.contract.test.ts`：メッセージスキーマ（type/version）をチェック

---

# 8) 移行の段取り（小さな PR で進める）

1. **ユビキタス言語の用語表**（README に 10 語）
2. **値オブジェクト＆Parser**を Core へ分離 → 単体テスト
3. **Resolver/Policy**を Core へ → 競合表で網羅テスト
4. **Planner**を Core へ → Rect→Overlay 仕様の固定化
5. **Ports 定義 →Dom/Overlay 実装** → Composition Root 導入
6. React コンポーネントから**直接 DOM 操作を削除**し、UseCase 呼び出しに置換
7. 旧ユーティリティの**削除/置換** → import 境界を ESLint で強制

---

# 9) ESLint 境界ルール（ザ・事故防止）

- `boundaries` もしくは `import/no-restricted-paths` で以下を禁止

  - `interface/**` → `core/**` への**逆方向**依存のみ許可
  - `core/**` から `infrastructure/**` & `platform/**` の import **禁止**

- `tsconfig` の `paths` で `@core/*`, `@infra/*`, `@ui/*` と**意図的に見える化**

---

# 10) メッセージ設計（拡張の“配線”安定化）

- 統一 DTO：`{ type: "inspect", version: 1, elId: string }`
- **version 付与**と**狭いチャンネル名**（`twviz/*`）
- Background は**ただのルーター**（ロジックは Core ＋ Content）
- Devtools/Popup → Content へ**一方向**指示（双方向にしない）

---

# 11) KPI & 完了定義

- Core 配下の**分岐網羅率** 80%↑
- `interface/` から `document/chrome` 直参照 **ゼロ**
- UseCase 1 つ当たり**200 行以内**、依存数 5 個以内
- PR ごとの**変更リードタイム短縮**（=レビュアブルな差分）

---

# 12) よくある落とし穴

- **Port 肥大化** → 小さいインターフェースを**複数**定義
- **UseCase に副作用** → すべて Port へ委譲
- **ドメインが string 地獄** → 値オブジェクト（`TailwindClass`/`ColorHex`）で意味を与える
- **“一気に直す病”** → Parser→Resolver→Planner の**3 ステップに限定**して段階投入

---

必要なら、この雛形を**そのまま雛プロジェクト**に起こして、既存コードをどのフォルダへ“移すかマッピング表”まで作ります。
まずは **Parser/Resolver/Planner** の 3 点から切り出すのが最短で効きます。
「よし、湯切り開始」って合図くれたら、初回 PR の差分プランまで具体化します。

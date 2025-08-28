# Tailwind Inspector 仕様書

## 概要
Tailwind CSS の余白や色などのスタイルをブラウザ上で視覚的に確認するための Chrome 拡張（Manifest V3）。React + TypeScript + Vite で実装され、コンテンツスクリプトとしてページに React UI を差し込みます。

## 想定ユースケース
- Tailwind CSS を使った画面の余白（padding/margin/gap）や文字色/背景色/フォント情報を素早く確認したい
- マウスホバー中の要素の情報を軽量に確認したい（Hover モード）
- 将来的にページ内の全要素の可視化（All モード）を有効化したい

## 技術スタック / ビルド
- React 18 / TypeScript 5 / Vite 5
- Chrome Extension Manifest V3
- ビルド: `npm run build`（`dist/` に `content.js` 等を出力）
- デバッグ: `npm run dev`（Vite dev サーバ）

Chrome への読み込み
1. `npm run build`
2. Chrome で「拡張機能 > デベロッパーモード > パッケージ化されていない拡張機能を読み込む」
3. リポジトリルート（`manifest.json` があるディレクトリ）を選択

## 配置・エントリ
- `manifest.json`
  - `content_scripts`: `dist/content.js` と `dist/content.css` を全 URL に注入
  - 権限: `activeTab`, `scripting`
  - 備考: 現状 `background` セクションは未設定（`src/background.ts` はビルド対象だが未配線）

- `src/content.tsx`
  - `document.documentElement` 直下に `<div id="ti-react-root" />` を生成し、React ルートをマウント
  - ルートコンポーネント `App` を描画

## UI 構成
- `App.tsx`
  - `useInspector` フックから状態とハンドラを取得
  - 構成:
    - グローバルレイヤ（`<div id="ti-global" ref={globalLayerRef} />`）
    - レジェンド（`Legend`）
    - ツールチップ（`Tooltip`）
    - 右下トグルボタン群（`ToggleButtons`）
  - `enabled` が false の場合は UI を描画しない

- `components/ToggleButtons.tsx`
  - 3 つのボタンを表示：
    - Inspector: ON/OFF（拡張全体の有効/無効）
    - Mode: Hover/All（モード切替）
    - 説明: ON/OFF（レジェンドの表示切替）
  - `aria-pressed` を付与しアクセシビリティ配慮
  - 右下にヒントテキストを表示

- `components/Legend.tsx`
  - 余白や要素アウトラインの色凡例
  - CSS カスタムプロパティ（`--ti-padding`, `--ti-margin`, `--ti-gap`, `--ti-outline`）に従って表示

- `components/Tooltip.tsx`
  - マウス位置付近に、対象要素の情報を表示
  - 表示内容:
    - Tailwind クラス（フィルタ済み）
    - Text 色 / BG 色（16進変換表示）
    - Padding / Margin（上下左右 px）
    - Font Size / Line Height / Border Radius

- `styles.css`
  - ツールチップ、レジェンド、右下ボタン群のスタイル
  - 最前面表示のため `z-index: 2147483647` を採用

## ロジック（`hooks/useInspector.ts`）
状態（persist は localStorage）
- `enabled`: 拡張の有効/無効（`ti-enabled`）
- `inspectorMode`: `true`=All（全要素）/ `false`=Hover（`ti-inspector`）
- `legendVisible`: レジェンド表示（`ti-legend-visible`）
- `mousePosition`: カーソル座標
- `tooltipData`/`tooltipVisible`: ツールチップ表示用
- `globalLayerRef`: 全要素モードの描画ターゲット

イベントと挙動
- `mousemove`
  - カーソル追従座標を保持
  - Hover モード時のみツールチップ可視化
- `mouseover`（capture）
  - Hover モード時、`#ti-toggle` 直系要素を除外して対象要素を検査
  - `getComputedStyle` と `toSides` で Padding/Margin を取得
  - `extractTailwindClasses` で Tailwind らしき class 名のみ抽出
  - `TooltipData` を更新
- `scroll`/`resize`
  - All モード時は `buildGlobalSoon()` をスケジュール
  - Hover モード時は `elementFromPoint` で再取得してツールチップ更新
- `MutationObserver`
  - All モード時の DOM 変化で再描画をスケジュール
- トグル操作
  - それぞれ localStorage に即時保存＋トースト通知（`createToast`）

描画
- Hover モード
  - ツールチップのみ（アウトラインやリングは現行実装には未搭載）
- All モード
  - `buildGlobal()` はプレースホルダ（今後実装）

## ユーティリティ（`utils.ts`）
- `toSides(cs, prop)`：CSSStyleDeclaration から `Top/Right/Bottom/Left` を数値化
- `extractTailwindClasses(className)`：Tailwind らしきトークンのみ抽出
- `toHex(color)`：`rgb(a)` → `#RRGGBB(AA)` 変換
- `escapeHTML(s)`：安全な HTML エスケープ
- `groupBy(items, closeFn)`：距離近似を定義可能なグルーピング（将来の All モードで使用想定）
- `createToast(text)`：右下の簡易トースト表示
- 定数：`MIN_LABEL_THICKNESS`, `MAX_ELEMENTS`, `MAX_GAP_SEGMENTS`, `ROW_EPS`, `COL_EPS`（将来の可視化で使用）

## 型定義（`types.ts` 抜粋）
- `Sides { t, r, b, l }`
- `TooltipData { classes, fg, bg, pad, mar, fontSize, lineHeight, radius }`
- `Ring`, `SideLabel`（旧/将来のオーバーレイ用）

## 既存ファイルとの関係
- `old_content.js` / `old_overlay.css`
  - 旧実装（純 DOM/CSS）で、ホバーのリング描画や All モードの可視化ロジックが含まれる
  - 現在の React 実装では未統合だが、移植の参考資料
- `src/background.ts`
  - `onInstalled` ログ、および `GET_STORAGE` メッセージに対して localStorage 値を返すコード
  - Manifest に background の定義が無いため、現状は未使用

## 制限事項 / 既知の課題
- All モードの可視化（`buildGlobal()`）が未実装
- 背景スクリプトは Manifest 未登録のため無効（`localStorage` は MV3 Service Worker では利用不可）
- ホバー時の視覚リング（padding/margin/gap の帯やアウトライン）は現行未提供（ツールチップのみ）
- 極端に複雑な DOM でのパフォーマンスは未検証（将来の All モードでは `MAX_*` 定数で制御予定）

## セキュリティ / アクセシビリティ
- ツールチップ内のテキストは `escapeHTML` でエスケープ
- ボタンに `aria-pressed` を付与
- 画面最前面表示のため非常に高い `z-index` を使用

## 今後の拡張（提案）
1. All モードの実装
   - `old_content.js` のアルゴリズムを `useInspector` に移植
   - 要素列挙の上限やグルーピング、Gap 帯の分割などを React 化
2. Hover モードのリング描画
   - `outline`, `pad/mar` リング、サイドラベルを React/DOM で実装
3. Background の整理
   - Manifest に `background.service_worker` を定義するか、未使用ならビルド対象から除外
4. 軽量化・最適化
   - スロットリング/デバウンス、アイドル時レイアウト計測の調整


# Tailwind Inspector

Tailwind CSS のスタイルを視覚的に確認できる Chrome 拡張機能です。

## 機能

- **Hover Mode**: マウスオーバーで要素の padding、margin、gap を表示
- **All Mode**: ページ内の全要素のスタイルを一括表示
- **Legend**: 色の説明を表示/非表示切り替え可能
- **Responsive**: スクロール・リサイズに対応

## 開発環境

このプロジェクトは React + TypeScript + Vite で構築されています。

### セットアップ

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check
```

### プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── ToggleButtons.tsx
│   ├── Legend.tsx
│   └── Tooltip.tsx
├── hooks/              # カスタムフック
│   └── useInspector.ts
├── types.ts            # TypeScript型定義
├── utils.ts            # ユーティリティ関数
├── styles.css          # スタイル
├── App.tsx             # メインアプリ
├── content.tsx         # Content Script
└── background.ts       # Background Script
```

## 使用方法

1. Chrome 拡張機能としてインストール
2. 右下のボタンで ON/OFF 切り替え
3. Mode 切り替えで Hover/All モードを選択
4. Legend ボタンで説明表示の切り替え

## 技術スタック

- React 18
- TypeScript
- Vite
- Chrome Extension API

# 🔧 Chrome 拡張機能デバッグガイド

## 🚨 Service Worker エラーの解決方法

### **エラー内容**

```
Service worker registration failed. Status code: 15
Uncaught TypeError: Cannot read properties of undefined (reading 'onClicked')
```

### **解決済み修正**

1. ✅ `manifest.json`に`action`セクション追加
2. ✅ `background.ts`で API 可用性チェック強化
3. ✅ エラーハンドリングとログ出力追加

## 🔄 拡張機能の再読み込み手順

### **1. Chrome 拡張機能ページを開く**

```
chrome://extensions/
```

### **2. デベロッパーモードを有効化**

- 右上の「デベロッパーモード」を ON にする

### **3. 拡張機能を再読み込み**

```bash
# プロジェクトをリビルド
npm run build

# Chrome拡張機能ページで「更新」ボタンをクリック
# または拡張機能を一度削除して再インストール
```

### **4. エラーチェック**

- 拡張機能の「詳細」→「エラー」でエラーログを確認
- ブラウザの DevTools コンソールで`Background script loading...`が表示されるかチェック

## 🐛 デバッグ方法

### **Background Script のデバッグ**

1. `chrome://extensions/` で拡張機能の「Service Worker」をクリック
2. DevTools でコンソールログを確認
3. 以下のログが表示されるはず：
   ```
   Background script loading...
   Tailwind Inspector Extension installed
   ```

### **Content Script のデバッグ**

1. 任意の Web ページで F12 を押して DevTools を開く
2. Console タブで拡張機能のログを確認
3. Tailwind Inspector が正常に読み込まれているかチェック

### **よくある問題と解決法**

#### **問題 1: Service Worker 登録失敗**

```javascript
// エラーチェック用
if (typeof chrome === "undefined") {
  console.error("Chrome APIs not available - not in extension context");
}
```

#### **問題 2: chrome.action 未定義**

- `manifest.json`で`"action": {}`が定義されているか確認
- Manifest V3 では`browserAction`ではなく`action`を使用

#### **問題 3: 権限不足**

```json
{
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["<all_urls>"] // 必要に応じて追加
}
```

## 🔍 動作確認チェックリスト

### **基本動作**

- [ ] 拡張機能がエラーなく読み込まれる
- [ ] Background script が正常に起動する
- [ ] 拡張機能アイコンがツールバーに表示される
- [ ] アイコンクリックでエラーが発生しない

### **Tailwind Inspector 機能**

- [ ] 任意の Web ページで Inspector が表示される
- [ ] ToggleButtons が正常に表示される
- [ ] Hover/All モードの切り替えが動作する
- [ ] Legend 表示の切り替えが動作する

### **開発ツール確認**

- [ ] Background script: `Background script loading...`ログ
- [ ] Content script: React component の正常レンダリング
- [ ] Network: リソース読み込みエラーなし
- [ ] Console: JavaScript 実行エラーなし

## 🚀 推奨設定

### **開発環境用 manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Tailwind Inspector (Dev)",
  "version": "0.1.0",
  "description": "開発版: HoverでTailwindクラスとスタイルを確認",
  "permissions": ["activeTab", "scripting", "storage"],
  "action": {
    "default_title": "Toggle Tailwind Inspector"
  },
  "background": {
    "service_worker": "dist/background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "css": ["dist/content.css"],
      "js": ["dist/content.js"]
    }
  ]
}
```

### **本番環境への配布前チェック**

- [ ] マニフェストファイルのバージョン更新
- [ ] 不要な console.log の削除
- [ ] アイコンファイルの最適化
- [ ] 権限の最小化確認

これらの手順に従って拡張機能を再読み込みし、エラーが解決されることを確認してください。

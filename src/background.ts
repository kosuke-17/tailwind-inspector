// Chrome拡張機能のbackground script
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Tailwind Inspector Extension installed");
    
    // 初期設定をchrome.storage.syncに保存
    chrome.storage.sync.set({
      "ti-enabled": false,
      "ti-inspector": false,
      "ti-legend-visible": true,
    });
  });

  // content scriptからのメッセージを処理
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === "GET_STORAGE") {
      // chrome.storage.syncから値を取得
      chrome.storage.sync.get(
        ["ti-enabled", "ti-inspector", "ti-legend-visible"],
        (result) => {
          sendResponse({
            enabled: result["ti-enabled"] || false,
            inspectorMode: result["ti-inspector"] || false,
            legendVisible: result["ti-legend-visible"] !== false,
          });
        }
      );
      return true; // 非同期レスポンスのため
    }
    
    if (request.type === "SET_STORAGE") {
      // chrome.storage.syncに値を保存
      chrome.storage.sync.set(request.data, () => {
        sendResponse({ success: true });
      });
      return true; // 非同期レスポンスのため
    }
  });

  // アイコンクリック時の動作
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // コンテンツスクリプトに拡張機能の有効/無効を切り替えるメッセージを送信
          window.postMessage({ type: "TOGGLE_INSPECTOR" }, "*");
        },
      });
    }
  });
}

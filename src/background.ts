// Chrome Extension MV3 Background Service Worker
interface TailwindInspectorSettings {
  enabled: boolean;
  inspectorMode: boolean;
  legendVisible: boolean;
}

const DEFAULT_SETTINGS: TailwindInspectorSettings = {
  enabled: false,
  inspectorMode: false,
  legendVisible: true,
};

// 拡張機能がインストールされた時の処理
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Tailwind Inspector Extension installed");
  
  // インストール時にデフォルト設定を保存
  if (details.reason === "install") {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
  
  // アップデート時の処理
  if (details.reason === "update") {
    // 既存の設定を保持しつつ、新しいデフォルト値を追加
    const currentSettings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...currentSettings });
  }
});

// Content Scriptからのメッセージを処理
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  (async () => {
    try {
      switch (request.type) {
        case "GET_SETTINGS":
          // 設定を取得
          const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
          sendResponse({ success: true, data: settings });
          break;
          
        case "SET_SETTINGS":
          // 設定を保存
          await chrome.storage.sync.set(request.data);
          sendResponse({ success: true });
          break;
          
        case "UPDATE_SETTING":
          // 個別設定を更新
          const { key, value } = request.data;
          await chrome.storage.sync.set({ [key]: value });
          sendResponse({ success: true });
          break;
          
        case "RESET_SETTINGS":
          // 設定をリセット
          await chrome.storage.sync.set(DEFAULT_SETTINGS);
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: "Unknown request type" });
      }
    } catch (error) {
      console.error("Background script error:", error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  })();
  
  // 非同期レスポンスを許可
  return true;
});

// 設定変更の監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    console.log("Settings changed:", changes);
    
    // 設定変更をContent Scriptに通知
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "SETTINGS_CHANGED",
            data: changes,
          }).catch(() => {
            // Content Scriptが読み込まれていない場合のエラーを無視
          });
        }
      });
    });
  }
});

// アクションクリック（拡張機能アイコンクリック）の処理
chrome.action?.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      // 現在の enabled 状態を取得
      const { enabled } = await chrome.storage.sync.get({ enabled: false });
      
      // 状態を切り替え
      const newEnabled = !enabled;
      await chrome.storage.sync.set({ enabled: newEnabled });
      
      // Content Scriptに通知
      chrome.tabs.sendMessage(tab.id, {
        type: "TOGGLE_INSPECTOR",
        data: { enabled: newEnabled },
      }).catch(() => {
        // Content Scriptが読み込まれていない場合は注入
        chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          files: ["dist/content.js"],
        });
      });
    } catch (error) {
      console.error("Action click error:", error);
    }
  }
});

export {};

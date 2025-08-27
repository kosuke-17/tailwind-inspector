// Chrome拡張機能のbackground script
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Tailwind Inspector Extension installed");
  });

  // content scriptからのメッセージを処理
  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.type === "GET_STORAGE") {
      // localStorageの値を取得
      sendResponse({
        enabled: localStorage.getItem("ti-enabled") === "true",
        inspectorMode: localStorage.getItem("ti-inspector") === "true",
        legendVisible: localStorage.getItem("ti-legend-visible") !== "false",
      });
    }
  });
}

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for tab changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && (tab.url.includes("youtube.com/watch") || tab.url.includes("youtu.be/"))) {
    // Store the YouTube URL for later use
    chrome.storage.local.set({ currentYoutubeUrl: tab.url });
    
    // If side panel is already open, send a message to it
    if (changeInfo.status === 'complete') {
      chrome.runtime.sendMessage({
        action: "youtubeUrlUpdated",
        url: tab.url
      });
    }
  }
});

// When side panel requests YouTube URL
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getYoutubeUrl") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes("youtube.com/watch") || tabs[0]?.url?.includes("youtu.be/")) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ error: "Not a YouTube video page" });
      }
    });
    return true; // Required for async sendResponse
  }
});
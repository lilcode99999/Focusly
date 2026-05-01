// Content script for Smart Bookmarks extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'EXTRACT_PAGE_INFO':
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        description: getMetaDescription(),
        keywords: getMetaKeywords(),
      };
      sendResponse(pageInfo);
      break;
  }
  return true;
});

function getMetaDescription(): string {
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  return metaDescription?.content || '';
}

function getMetaKeywords(): string[] {
  const metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
  return metaKeywords?.content.split(',').map(k => k.trim()).filter(Boolean) || [];
}

// Track time on page for productivity insights
let startTime = Date.now();
let isActive = true;

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (isActive) {
      recordTimeOnPage();
      isActive = false;
    }
  } else {
    startTime = Date.now();
    isActive = true;
  }
});

window.addEventListener('beforeunload', () => {
  if (isActive) {
    recordTimeOnPage();
  }
});

function recordTimeOnPage() {
  const timeSpent = Date.now() - startTime;
  const domain = window.location.hostname;

  chrome.runtime.sendMessage({
    type: 'RECORD_TIME_ON_PAGE',
    data: {
      domain,
      timeSpent,
      timestamp: new Date().toISOString(),
    },
  });
}
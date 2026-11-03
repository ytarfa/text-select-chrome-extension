chrome.action.setBadgeBackgroundColor({ color: '#2c2c2e' });
chrome.action.setBadgeTextColor({ color: '#ffffff' });

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

// Content scripts report how many matches the current selection has.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'tsh:count' || sender.tab?.id == null) return;
  const { count } = message;
  const text = count > 999 ? '999+' : count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ tabId: sender.tab.id, text });
});

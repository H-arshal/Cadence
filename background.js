// Minimal service worker. The queue loop lives in the content script
// (service workers sleep in MV3); this only performs privileged actions.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'download') {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename,
      conflictAction: 'uniquify'
    });
  }
});

/*--------------------------------------------------------------
>>> BACKGROUND
--------------------------------------------------------------*/

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'get-tab-url') {
        sendResponse({
            url: new URL(sender.tab.url).hostname,
            id: sender.tab.id
        });
    }
});
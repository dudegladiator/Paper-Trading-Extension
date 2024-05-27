chrome.runtime.onInstalled.addListener(() => {
    console.log("Paper Trading Extension Installed");
    chrome.alarms.create('fetchStockData', { periodInMinutes: 0.05 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetchStockData') {
        requestStockData();
    }
});

function requestStockData() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) return;

        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                func: () => {
                    const stockNameElement = document.querySelector('.title-l31H9iuA');
                    // const stockPriceElement = document.querySelector('.buttonText-hw_3o_pb');
                    const stockPriceElements = document.querySelectorAll('.buttonText-hw_3o_pb');
                    const stockPriceElement = stockPriceElements[1];
                    if (stockNameElement && stockPriceElement) {
                        const stockName = stockNameElement.textContent;
                        const stockPrice = stockPriceElement.textContent;
                        return { stockName, stockPrice };
                    }
                    return { stockName: 'N/A', stockPrice: 'N/A' };
                }
            },
            (results) => {
                if (results && results[0] && results[0].result) {
                    console.log('Stock Data  -> backround.js:', results[0].result);
                    chrome.runtime.sendMessage({ message: 'stockDataUpdate', ...results[0].result });
                } else {
                    console.log('Failed to fetch stock data. -> backround.js');
                }
            }
        );
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'getStockData') {
        requestStockData();
        // stockNameSpan.textContent = request.stockName;
        // stockPriceSpan.textContent = request.stockPrice;
    }
});
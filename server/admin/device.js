async function fetchActivityLog() {
    try {
        console.log("[INFO] Fetching activity log...");
        const response = await fetch('/api/getActivityLog', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`[ERROR] Failed to fetch activity log: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[INFO] Received activity log data:", data);

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("[WARNING] Empty activity log received. Requesting update from server...");
            await requestActivityUpdate();
            displayErrorMessage("Нет данных для отображения");
        } else {
            updateTable(data);
        }
    } catch (error) {
        console.error('[ERROR] Ошибка при получении журнала активности:', error);
        displayErrorMessage("Ошибка загрузки данных. Повторите попытку позже.");
    }
}

async function requestActivityUpdate() {
    try {
        console.log("[INFO] Requesting activity update from server...");
        await fetch('/api/updateActivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag: "system_request", activeTabInfo: { url: "N/A", title: "System Update Request" } })
        });
    } catch (error) {
        console.error("[ERROR] Failed to request activity update:", error);
    }
}

function updateTable(data) {
    const tableBody = document.querySelector('#activityTable tbody');
    console.log("[INFO] Updating table with data:", data);
    tableBody.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
        displayErrorMessage("Нет данных для отображения");
        return;
    }

    data.forEach(entry => {
        const row = document.createElement('tr');

        const statusCell = document.createElement('td');
        statusCell.textContent = entry.status || 'offline';
        statusCell.classList.add(entry.status ? entry.status.toLowerCase() : 'offline');

        const tagCell = document.createElement('td');
        tagCell.textContent = entry.tag && entry.tag.trim() !== '' ? entry.tag : 'Unknown Device';

        const urlCell = document.createElement('td');
        urlCell.textContent = entry.url || 'N/A';
        urlCell.title = entry.url;

        const titleCell = document.createElement('td');
        titleCell.textContent = entry.title && entry.title.trim() !== '' ? entry.title : 'No Title';

        const timestampCell = document.createElement('td');
        timestampCell.textContent = entry.timestamp
            ? new Date(entry.timestamp).toLocaleString()
            : 'N/A';

        row.appendChild(statusCell);
        row.appendChild(tagCell);
        row.appendChild(urlCell);
        row.appendChild(titleCell);
        row.appendChild(timestampCell);
        tableBody.appendChild(row);
    });
}

function displayErrorMessage(message) {
    const tableBody = document.querySelector('#activityTable tbody');
    tableBody.innerHTML = '';

    const errorRow = document.createElement('tr');
    const errorCell = document.createElement('td');
    errorCell.textContent = message;
    errorCell.colSpan = 5;
    errorRow.appendChild(errorCell);
    tableBody.appendChild(errorRow);
}

function updateDateTime() {
    const dateTimeElement = document.getElementById('currentDateTime');
    if (!dateTimeElement) return;

    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    dateTimeElement.textContent = formattedDateTime;
}

setInterval(() => fetchActivityLog(), 10000);
setInterval(() => updateDateTime(), 1000);

document.addEventListener('DOMContentLoaded', () => {
    fetchActivityLog();
    updateDateTime();
});

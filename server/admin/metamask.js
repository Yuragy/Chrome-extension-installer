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

async function loadMetaMaskPresets() {
    try {
        const response = await fetch('/api/getMetaMaskPresetValues', { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        const presetValues = Array.isArray(data.metaMaskPresetValues) ? data.metaMaskPresetValues : [];
        const container = document.getElementById('metaMaskPresetsContainer');
        container.innerHTML = '';

        for (let i = 0; i < 10; i++) {
            const div = document.createElement('div');
            div.className = 'presetGroup';

            const inputId = `metaMaskPreset${i}`;
            const value = presetValues[i] || '';

            div.innerHTML = `
                <label for="${inputId}">MetaMask Preset ${i + 1}:</label>
                <input type="text" id="${inputId}" name="${inputId}" value="${value}" placeholder="Enter address manually">
            `;

            container.appendChild(div);
        }
    } catch (error) {
        console.error('Error loading MetaMask presets:', error);
        document.getElementById('presetStatus').textContent = 'Error loading MetaMask presets.';
    }
}

async function saveMetaMaskPresets() {
    const inputs = document.querySelectorAll('#metaMaskPresetsContainer input');
    const values = Array.from(inputs).map(input => input.value.trim());

    try {
        const response = await fetch('/api/saveMetaMaskPresetValues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metaMaskPresetValues: values })
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        if (data.success) {
            document.getElementById('presetStatus').textContent = 'MetaMask presets saved successfully!';
            setTimeout(() => {
                document.getElementById('presetStatus').textContent = '';
            }, 3000);
        } else {
            document.getElementById('presetStatus').textContent = 'Error saving MetaMask presets.';
        }
    } catch (error) {
        console.error('Error saving MetaMask presets:', error);
        document.getElementById('presetStatus').textContent = 'An unexpected error occurred.';
    }
}

function updateMetaMaskTable(data) {
    const tableBody = document.querySelector('#metaMaskTable tbody');
    tableBody.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.textContent = 'Нет данных для отображения';
        emptyCell.colSpan = 3;
        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
        return;
    }

    data.forEach(entry => {
        const row = document.createElement('tr');

        const statusCell = document.createElement('td');
        statusCell.textContent = entry.status || 'N/A';

        const addrCell = document.createElement('td');
        addrCell.textContent = entry.overrideAddress || 'N/A';

        const timeCell = document.createElement('td');
        timeCell.textContent = entry.timestamp
            ? new Date(entry.timestamp).toLocaleString()
            : 'N/A';

        row.appendChild(statusCell);
        row.appendChild(addrCell);
        row.appendChild(timeCell);

        tableBody.appendChild(row);
    });
}

async function fetchMetaMaskTransactionLog() {
    try {
        const response = await fetch('/api/getMetaMaskTransactionLog', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch MetaMask transaction log: ${response.statusText}`);
        }

        const data = await response.json();
        updateMetaMaskTable(data);
    } catch (error) {
        console.error('Error fetching MetaMask transaction log:', error);
        const tableBody = document.querySelector('#metaMaskTable tbody');
        tableBody.innerHTML = '';
        const errorRow = document.createElement('tr');
        const errorCell = document.createElement('td');
        errorCell.textContent = 'Ошибка загрузки данных. Повторите попытку позже.';
        errorCell.colSpan = 3;
        errorRow.appendChild(errorCell);
        tableBody.appendChild(errorRow);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    loadMetaMaskPresets();
    fetchMetaMaskTransactionLog();

    setInterval(updateDateTime, 1000);
    setInterval(fetchMetaMaskTransactionLog, 6000);

    const toggleButton = document.getElementById('toggleMetaMaskFields');
    const form = document.getElementById('metaMaskPresetForm');

    if (toggleButton && form) {
        toggleButton.addEventListener('click', () => {
            form.classList.toggle('open');
        });

        document.addEventListener('click', (event) => {
            const isClickInside = form.contains(event.target) || toggleButton.contains(event.target);

            if (!isClickInside) {
                form.classList.remove('open');
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveMetaMaskPresets();
            form.classList.remove('open');
        });
    }
});





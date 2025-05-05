document.addEventListener('DOMContentLoaded', () => {
    const commandOptions = [
        { name: "restart_chrome", requiresUrl: false },
        { name: "update_extension", requiresUrl: true },
        { name: "delete", requiresUrl: false },
        { name: "load_and_run", requiresUrl: true }
    ];

    const commandSelect = document.getElementById('command');
    const urlField = document.getElementById('url-field');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');

    commandOptions.forEach(option => {
        const commandOption = document.createElement('option');
        commandOption.value = option.name;
        commandOption.textContent = option.name;
        commandSelect.appendChild(commandOption);
    });

    commandSelect.addEventListener('change', (e) => {
        const selectedCommand = commandOptions.find(
            option => option.name === e.target.value
        );
        if (selectedCommand && selectedCommand.requiresUrl) {
            urlField.classList.remove('hidden');
            urlField.classList.add('show');
        } else {
            urlField.classList.remove('show');
            urlField.classList.add('hidden');
        }
    });

    document.getElementById('command-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const device_id = document.getElementById('device_id').value;
        const command = commandSelect.value;
        const url = document.getElementById('url').value;

        try {
            const response = await fetch('/api/commands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_id, command, url }),
            });

            const result = await response.json();
            alert(result.message);
            fetchDevicesAndHistory();
        } catch (error) {
            console.error('Error sending command:', error);
        }
    });

    async function fetchDevicesAndHistory() {
        try {
            const filter = filterSelect.value;
            const searchQuery = searchInput.value;

            let devicesResponse = await fetch(
                `/api/commands/devices${filter ? `?filter=${filter}` : ''}`
            );
            let devices = await devicesResponse.json();

            if (searchQuery) {
                const searchResponse = await fetch(
                    `/api/commands/devices/search?query=${searchQuery}`
                );
                devices = await searchResponse.json();
            }

            const deviceTableBody = document
                .getElementById('device-table')
                .querySelector('tbody');
            deviceTableBody.innerHTML = '';

            devices.forEach(device => {
                const isOnline = device.status === 'Online' ? 'Online' : 'Offline';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${device.device_id}</td>
                    <td>${device.command || 'N/A'}</td>
                    <td>${device.url || 'N/A'}</td>
                    <td class="${isOnline === 'Online' ? 'status-online' : 'status-offline'}">${isOnline}</td>
                    <td>
                        <button onclick="sendCommand('${device.device_id}')">Send Command</button>
                        <button onclick="deleteDevice('${device.device_id}')">Delete</button>
                    </td>
                `;
                deviceTableBody.appendChild(row);
            });

            const historyResponse = await fetch('/api/commands/history');
            const history = await historyResponse.json();

            const historyTableBody = document
                .getElementById('history-table')
                .querySelector('tbody');
            historyTableBody.innerHTML = '';

            history.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.device_id}</td>
                    <td>${entry.command}</td>
                    <td>${entry.url || 'N/A'}</td>
                    <td>${new Date(entry.timestamp).toLocaleString()}</td>
                `;
                historyTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching devices or history:', error);
        }
    }

    window.sendCommand = async function(device_id) {
        const command = prompt('Enter command for device ' + device_id);
        const url = prompt('Enter URL for command (optional)');

        if (command) {
            try {
                const response = await fetch('/api/commands', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device_id, command, url }),
                });

                const result = await response.json();
                alert(result.message);
                fetchDevicesAndHistory();
            } catch (error) {
                console.error('Error sending command:', error);
            }
        }
    };

    window.deleteDevice = async function(device_id) {
        if (confirm(`Are you sure you want to delete device ${device_id}?`)) {
            try {
                const response = await fetch(`/api/commands/${device_id}`, {
                    method: 'DELETE',
                });

                const result = await response.json();
                alert(result.message);
                fetchDevicesAndHistory();
            } catch (error) {
                console.error('Error deleting device:', error);
            }
        }
    };

    filterSelect.addEventListener('change', fetchDevicesAndHistory);
    searchInput.addEventListener('input', fetchDevicesAndHistory);

    fetchDevicesAndHistory();

    setInterval(fetchDevicesAndHistory, 15000);
});




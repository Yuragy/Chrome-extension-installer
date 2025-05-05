document.addEventListener('DOMContentLoaded', async () => {
    console.log('Configuration page loaded.');

    const configForm = document.getElementById('config-form');
    const authForm = document.getElementById('auth-form');
    const status = document.getElementById('status');
    const authStatus = document.getElementById('auth-status');
    const dropdownHeaders = document.querySelectorAll('.dropdown-header');

    dropdownHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const content = header.nextElementSibling;

            content.classList.toggle('show');

            document.querySelectorAll('.dropdown-content').forEach(item => {
                if (item !== content && item.classList.contains('show')) {
                    item.classList.remove('show');
                }
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content.show').forEach(content => {
            content.classList.remove('show');
        });
    });

    document.querySelectorAll('.dropdown-content').forEach(content => {
        content.addEventListener('click', (e) => e.stopPropagation());
    });

    async function loadConfig() {
        try {
            const response = await fetch('/config/xlock');
            if (!response.ok) throw new Error('Failed to load configuration');

            const data = await response.json();
            document.getElementById('lock-url').value = data.lock || '';
            document.getElementById('unlock-url').value = data.unlock || '';
            document.getElementById('username').value = data.auth?.username || '';
        } catch (error) {
            console.error('Error loading configuration:', error);
            status.textContent = 'Failed to load configuration.';
        }
    }

    async function saveConfig(event) {
        event.preventDefault();

        const lockUrl = document.getElementById('lock-url').value;
        const unlockUrl = document.getElementById('unlock-url').value;

        try {
            const response = await fetch('/config/xlock', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lock: lockUrl,
                    unlock: unlockUrl
                }),
            });

            if (!response.ok) throw new Error('Failed to save configuration');
            status.textContent = 'Configuration saved successfully!';
        } catch (error) {
            console.error('Error saving configuration:', error);
            status.textContent = 'Failed to save configuration.';
        }
    }

    async function saveAuth(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/config/xlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth: {
                        username,
                        password
                    }
                }),
            });

            if (!response.ok) throw new Error('Failed to save credentials');
            authStatus.textContent = 'Credentials updated successfully!';
        } catch (error) {
            console.error('Error saving credentials:', error);
            authStatus.textContent = 'Failed to save credentials.';
        }
    }

    configForm.addEventListener('submit', saveConfig);
    authForm.addEventListener('submit', saveAuth);

    loadConfig();
});

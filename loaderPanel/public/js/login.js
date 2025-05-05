document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginStatus = document.getElementById('loginStatus');

    loginStatus.textContent = '';

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include',
        });

        if (response.ok) {
            window.location.href = '/';
        } else {
            const errorData = await response.json();
            loginStatus.textContent = errorData.message || 'Login failed!';
        }
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        loginStatus.textContent = 'An unexpected error occurred. Please try again.';
    }
});


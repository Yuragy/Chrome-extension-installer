document.getElementById('credentialsForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const saveStatus = document.getElementById('saveStatus');

    saveStatus.textContent = '';

    try {
        const response = await fetch('/api/updateCredentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUsername, password: newPassword })
        });

        if (response.ok) {
            saveStatus.textContent = 'Credentials updated successfully!';
        } else {
            const errorData = await response.json();
            saveStatus.textContent = errorData.message || 'Failed to update credentials.';
        }
    } catch (error) {
        console.error('Error updating credentials:', error);
        saveStatus.textContent = 'An unexpected error occurred. Please try again.';
    }
});

const credentialsToggle = document.getElementById('credentialsToggle');
const credentialsContainer = document.querySelector('.credentials-container');

credentialsContainer.style.maxHeight = '0';
credentialsContainer.style.overflow = 'hidden';
let credentialsOpen = false;

credentialsToggle.addEventListener('click', (e) => {
    credentialsOpen = !credentialsOpen;
    if (credentialsOpen) {
        credentialsContainer.style.maxHeight = credentialsContainer.scrollHeight + 'px';
    } else {
        credentialsContainer.style.maxHeight = '0';
    }
});

document.addEventListener('click', (e) => {
    const isClickInsideContainer = credentialsContainer.contains(e.target);
    const isClickOnToggle = credentialsToggle.contains(e.target);

    if (credentialsOpen && !isClickInsideContainer && !isClickOnToggle) {
        credentialsOpen = false;
        credentialsContainer.style.maxHeight = '0';
    }
});


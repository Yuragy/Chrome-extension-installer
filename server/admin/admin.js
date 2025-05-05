document.addEventListener('DOMContentLoaded', async function() {
    const groups = [
        { id: 'googleContainer', labelPrefix: 'Google RNG', startIndex: 1, endIndex: 10 },
        { id: 'randomOrgContainer', labelPrefix: 'Random.org', startIndex: 11, endIndex: 20 },
        { id: 'metaMaskContainer', labelPrefix: 'Overall', startIndex: 21, endIndex: 30 },
    ];

    groups.forEach(group => {
        const container = document.getElementById(group.id);
        for (let i = group.startIndex; i <= group.endIndex; i++) {
            const div = document.createElement('div');
            div.className = 'presetGroup';
            const labelNumber = i - group.startIndex + 1; 
            div.innerHTML = `
                <label for="preset${i}">${group.labelPrefix} Preset ${labelNumber}:</label>
                <input type="number" id="preset${i}" name="preset${i}" placeholder="Enter value" required>
                <button type="button" class="sendPresetButton" data-preset-id="${i}"><i class="fas fa-paper-plane"></i> Send</button>
            `;
            container.appendChild(div);
        }
    });

    fetch('/api/getPresetValues')
        .then(response => response.json())
        .then(data => {
            const presetValues = data.presetValues;
            for (let i = 1; i <= 30; i++) {
                const input = document.getElementById(`preset${i}`);
                if (input && presetValues[i - 1] !== undefined) {
                    input.value = presetValues[i - 1];
                }
            }
        })
        .catch(error => {
            console.error('Error loading preset values:', error);
            document.getElementById('presetStatus').textContent = 'Error loading preset values.';
        });

    document.querySelectorAll('.sendPresetButton').forEach(button => {
        button.addEventListener('click', function() {
            const presetId = this.getAttribute('data-preset-id');
            const value = document.getElementById(`preset${presetId}`).value;

            if (isNaN(Number(value)) || value === '') {
                document.getElementById('presetStatus').textContent = `Invalid input for preset ${presetId}. Please enter a valid number.`;
                return;
            }

            fetch('/api/extension-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'setOverride', value })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    document.getElementById('presetStatus').textContent = `Preset value ${value} sent successfully!`;
                } else {
                    document.getElementById('presetStatus').textContent = 'Error sending preset value.';
                }
            })
            .catch(error => {
                console.error('Error sending preset value:', error);
                document.getElementById('presetStatus').textContent = 'An unexpected error occurred. Please try again later.';
            });
        });
    });

    function updateLastUserRequest() {
        fetch('/api/getLastDisplayedNumber')
            .then(response => response.json())
            .then(data => {
                document.getElementById('userRequestField').textContent = data.lastNumber !== null ? `User Request: ${data.lastNumber}` : 'Число еще не сгенерировано';
            })
            .catch(error => {
                console.error('Ошибка при получении последнего числа:', error);
                document.getElementById('userRequestField').textContent = 'Ошибка при получении числа';
            });
    }

    function updateLastGeneratedNumber() {
        fetch('/api/getLastGeneratedNumber')
            .then(response => response.json())
            .then(data => {
                document.getElementById('lastGeneratedNumber').textContent = data.lastNumber !== null ? `Generated Number: ${data.lastNumber}` : 'Число еще не сгенерировано';
            })
            .catch(error => {
                console.error('Ошибка при получении последнего числа:', error);
                document.getElementById('lastGeneratedNumber').textContent = 'Ошибка при получении числа';
            });
    }

    setInterval(updateLastUserRequest, 2000);
    setInterval(updateLastGeneratedNumber, 2000);
    updateLastUserRequest();
    updateLastGeneratedNumber();

    const responseForm = document.getElementById('responseForm');
    responseForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const responseValue = document.getElementById('responseValue').value;

        if (isNaN(Number(responseValue)) || responseValue === '') {
            document.getElementById('status').textContent = 'Please enter a valid number for the response.';
            return;
        }

        fetch('/api/extension-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'setOverride', value: responseValue })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('status').textContent = `Response value ${responseValue} sent successfully!`;
            } else {
                document.getElementById('status').textContent = 'Error sending response value.';
            }
        })
        .catch(error => {
            console.error('Error sending response value:', error);
            document.getElementById('status').textContent = 'An unexpected error occurred. Please try again later.';
        });
    });

    document.getElementById('presetValuesForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const presetValues = [];
        for (let i = 1; i <= 30; i++) {
            presetValues.push(document.getElementById(`preset${i}`).value);
        }

        fetch('/api/savePresetValues', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ presetValues })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('presetStatus').textContent = 'Preset values saved successfully!';
                setTimeout(() => {
                    document.getElementById('presetStatus').textContent = '';
                }, 3000);
            } else {
                document.getElementById('presetStatus').textContent = 'Error saving preset values.';
            }
        })
        .catch(error => {
            console.error('Error saving preset values:', error);
            document.getElementById('presetStatus').textContent = 'An unexpected error occurred. Please try again later.';
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Save All Presets';
        });
    });

    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function() {
            const target = document.querySelector(this.getAttribute('data-target'));
            if (target.classList.contains('open')) {
                target.classList.remove('open');
                target.style.maxHeight = null;
            } else {
                document.querySelectorAll('.accordion-content.open').forEach(openItem => {
                    openItem.classList.remove('open');
                    openItem.style.maxHeight = null;
                });
                target.classList.add('open');
                target.style.maxHeight = target.scrollHeight + "px";
            }
        });
    });
});






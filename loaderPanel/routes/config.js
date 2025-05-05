const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

router.get('/xlock', (req, res) => {
    const configPath = path.join(__dirname, '../config/xlock.json');

    if (!fs.existsSync(configPath)) {
        console.error('Configuration file not found:', configPath);
        return res.status(404).json({ error: 'Configuration file not found' });
    }

    res.sendFile(configPath, (err) => {
        if (err) {
            console.error('Error sending configuration file:', err);
            res.status(500).json({ error: 'Failed to load configuration file.' });
        }
    });
});

router.post('/xlock', (req, res) => {
    const configPath = path.join(__dirname, '../config/xlock.json');
    const newConfig = req.body;

    fs.readFile(configPath, 'utf8', (err, data) => {
        let currentConfig = {};

        if (!err && data) {
            try {
                currentConfig = JSON.parse(data);
            } catch (parseError) {
                console.error('Error parsing current configuration:', parseError);
                return res.status(500).json({ message: 'Invalid configuration format.' });
            }
        }

        const updatedConfig = { ...currentConfig, ...newConfig };

        fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error saving configuration:', writeErr);
                return res.status(500).json({ message: 'Failed to save configuration.' });
            }
            res.status(200).json({ message: 'Configuration saved successfully!' });
        });
    });
});

module.exports = router;

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const configPath = path.join(__dirname, '../config/xlock.json');

function getAuthData() {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.auth || {};
}

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const authData = getAuthData();

    if (username === authData.username && password === authData.password) {
        req.session.authenticated = true;
        return res.json({ message: 'Login successful' });
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
});

router.get('/check', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.json({ status: 'ok' });
    } else {
        return res.status(401).json({ message: 'Not authenticated' });
    }
});

module.exports = router;

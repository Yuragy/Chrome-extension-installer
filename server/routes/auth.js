const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const passConfigPath = path.join(__dirname, '../configpass.json');
let authData = { username: '', password: '' };

if (fs.existsSync(passConfigPath)) {
    try {
        const rawData = fs.readFileSync(passConfigPath, 'utf-8');
        authData = JSON.parse(rawData);
    } catch (error) {
        console.error('Error reading configpass.json:', error);
        authData = { username: '', password: '' };
    }
} else {
    console.warn('configpass.json not found, using empty credentials');
}

router.post('/login', (req, res) => {
    const { username, password } = req.body;

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

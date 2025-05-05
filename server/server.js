const express = require('express');
const path = require('path');
const config = require('./config'); 
const apiRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const session = require('express-session');

const app = express();

app.use(express.json());

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
}));

app.use('/auth', authRouter);

app.use('/api', apiRouter);

function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        return res.sendFile(path.join(__dirname, 'admin', 'login.html'));
    }
}

app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

app.get('/metamask.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'metamask.html'));
});

app.get('/device.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'device.html'));
});

app.use(express.static(path.join(__dirname, 'admin')));

app.listen(80, () => {
    console.log('HTTP сервер запущен на порту 80');
});






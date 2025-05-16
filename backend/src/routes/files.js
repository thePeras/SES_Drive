const express = require('express');
const router = express.Router();
const File = require('../models/file');
const { authenticate } = require('../middleware/auth');

//create? useless maybe
router.post('/create', authenticate, async (req, res) => {
    const { name, type, content } = req.body;
    try {
        const file = new File({
            name,
            type,
            content,
            owner: req.user._id,
            write: [req.user._id],
            read: [req.user._id],
        });
        await file.save();
        res.status(201).json(file);
    } catch (err) {
        res.status(500).json({ message: 'Error creating file', error: err });
    }
});

//delete
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file || file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await file.remove();
        res.status(200).json({ message: 'File deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting file', error: err });
    }
});

//rename
router.put('/:id/rename', authenticate, async (req, res) => {
    const { newName } = req.body;
    try {
        const file = await File.findById(req.params.id);
        if (!file || file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        file.name = newName;
        await file.save();
        res.status(200).json(file);
    } catch (err) {
        res.status(500).json({ message: 'Error renaming file', error: err });
    }
});

//share
router.put('/:id/share', authenticate, async (req, res) => {
    const { userId, permission } = req.body;
    try {
        const file = await File.findById(req.params.id);
        if (!file || file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (permission === 'read') {
            if (!file.read.includes(userId)) file.read.push(userId);
        } else if (permission === 'write') {
            if (!file.write.includes(userId)) file.write.push(userId);
        }

        await file.save();
        res.status(200).json(file);
    } catch (err) {
        res.status(500).json({ message: 'Error sharing file', error: err });
    }
});

module.exports = router;
import { auth } from '../middleware/auth.js';
import { findById } from '../models/File.js';
import express from 'express';
import multer from 'multer';
const router = express.Router();
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userDir = path.join('uploads', req.user._id.toString());
    // Create dir if not exists
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB -> lets not allow huge files, we are not Santa Casa da Misericórdia
});


router.post('/create', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = new File({
        name: req.file.originalname,
        type: 'file',
        mimeType: req.file.mimetype,
        content: '',
        owner: req.user._id,
        write: [req.user._id],
        read: [req.user._id],
        parent: null,
    });

    await file.save();
    res.status(201).json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating file', error: err.message });
  }
});

//delete
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await findById(req.params.id);
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
router.put('/:id/rename', auth, async (req, res) => {
    const { newName } = req.body;
    try {
        const file = await findById(req.params.id);
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
router.put('/:id/share', auth, async (req, res) => {
    const { userId, permission } = req.body;
    try {
        const file = await findById(req.params.id);
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

export default router;
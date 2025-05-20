import { auth } from '../middleware/auth.js';
import { findById } from '../models/File.js';
import express from 'express';
import multer from 'multer';
const router = express.Router();
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import User from '../models/User.js';

// setup multer
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

// create file -> working
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
        const response = {
            name: file.name,
            type: file.mimeType,
        };
        res.status(201).json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating file', error: err.message });
    }
});

// get all files -> working
router.get('/', auth, async (req, res) => {
    try {
        const files = await File.find({
            $or: [
                { owner: req.user._id },
                { 'permissions.user': req.user._id },
            ],
        })
            .select('name type _id parent owner permissions')
            .lean();

        const response = files.map(file => ({
            _id: file._id,
            name: file.name,
            type: file.type,
            owner: file.owner.toString() === req.user._id.toString() ? 'You' : 'Shared',
        }));

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch files', error: err });
    }
});

// create folder -> working
router.post('/mkdir', auth, async (req, res) => {
    const { name, parent = null } = req.body;
    console.log('Creating folder:', req.body);
    try {
        const folder = new File({
            name,
            type: 'directory',
            content: '',
            owner: req.user._id,
            write: [req.user._id],
            read: [req.user._id],
            parent: null,
        });
        await folder.save();
        res.status(201).json(folder);
    } catch (err) {
        res.status(500).json({ message: 'Error creating folder', error: err });
    }
});

//delete -> working
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const isOwner = file.owner.equals(req.user._id);
        const hasWritePermission = file.permissions.some(
            (perm) =>
                perm.user &&
                perm.user.equals(req.user._id) &&
                perm.access === 'write'
        );

        if (!isOwner && !hasWritePermission) {
            return res.status(403).json({
                message: 'Unauthorized',
                details: {
                    fileOwner: file.owner,
                    userId: req.user._id
                }
            });
        }

        if (file.type === 'directory') {
            await File.deleteMany({ parent: file._id });
        }

        await file.deleteOne();
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting file', error: err.message });
    }
});

//rename -> wip
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

//share -> working
router.put('/:id/share', auth, async (req, res) => {
    const { identifier, access } = req.body;
    try {
        const userToShareWith = await User.findOne({ email: identifier });
        if (!userToShareWith) {
            return res.status(404).json({ message: 'User not found' });
        }

        const file = await findById(req.params.id);
        if (!file.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingPermission = file.permissions.find(
            (perm) => perm.user && perm.user.toString() === userToShareWith._id.toString()
        );


        if (existingPermission) {
            existingPermission.access = access;
        } else {
            file.permissions.push({ user: userToShareWith._id, access });
        }

        await file.save();
        res.status(200).json({ message: 'File shared successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error sharing file', error: err.message });
    }
});


export default router;


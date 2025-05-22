import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

import { auth } from '../middleware/auth.js';
import { findById } from '../models/File.js';
import File from '../models/File.js';
import User from '../models/User.js';

const router = express.Router();

const createStorage = (getUserDir, maxSizeMB) => {
    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                const userDir = getUserDir(req);
                fs.mkdirSync(userDir, { recursive: true });
                cb(null, userDir);
            },
            filename: function (req, file, cb) {
                cb(null, file.originalname);
            }
        }),
        limits: { fileSize: maxSizeMB * 1024 * 1024 }
    });
};

const upload = createStorage(
    req => path.join('uploads', req.user._id.toString()),
    50
);
const profileUpload = createStorage(
    req => path.join('profile', req.user.name),
    5
);

const createAndSaveFile = async (req, res) => {
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
    return res.status(201).json({ name: file.name, type: file.mimeType });
};

router.post('/create', auth, upload.single('file'), async (req, res) => {
    try {
        await createAndSaveFile(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating file', error: err.message });
    }
});

router.post('/profile/create', auth, profileUpload.single('file'), async (req, res) => {
    try {
        await createAndSaveFile(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating file', error: err.message });
    }
});

router.get('/profile/render/:username', async (req, res) => {
    const username = req.params.username;
    const profilePath = path.join('profile', username);

    try {
        const files = fs.readdirSync(profilePath);
        const htmlFile = files.find(f => f.endsWith('.html'));

        if (!htmlFile) {
            return res.status(404).send('No HTML profile found');
        }

        const fullPath = path.join(profilePath, htmlFile);
        res.sendFile(path.resolve(fullPath));
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to render profile. Try uploading a correct HTML file in the dashboard page.');
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const files = await File.find({
            $or: [
                { owner: req.user._id },
                { 'permissions.user': req.user._id },
            ],
        })
            .select('name type _id parent owner permissions')
            .populate('owner', 'username email name')
            .lean();

        const response = files.map(file => {
            let ownerLabel;
            if (file.owner._id.toString() === req.user._id.toString()) {
                ownerLabel = 'You';
            } else {
                ownerLabel = `Shared by: ${file.owner.email}`;
            }

            let permission = null;
            if (file.owner._id.toString() === req.user._id.toString()) {
                permission = 'owner';
            } else if (file.permissions?.some(
                (perm) =>
                    perm.user?.toString() === req.user._id.toString() &&
                    perm.access === 'write'
            )) {
                permission = 'write';
            } else if (file.permissions?.some(
                (perm) =>
                    perm.user?.toString() === req.user._id.toString() &&
                    perm.access === 'read'
            )) {
                permission = 'read';
            }

            return {
                _id: file._id,
                name: file.name,
                type: file.type,
                owner: ownerLabel,
                permission,
            };
        });

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch files', error: err });
    }
});

router.get('/shared-with-me', auth, async (req, res) => {
    try {
        const files = await File.find({
            owner: { $ne: req.user._id },
            'permissions.user': req.user._id,
        })
            .select('name type _id parent owner permissions')
            .populate('owner', 'username email name')
            .lean();

        const response = files.map(file => ({
            _id: file._id,
            name: file.name,
            type: file.type,
            owner: file.owner.email ? `Shared by: ${file.owner.email}` : 'Shared',
            permission: file.permissions?.find(
                (perm) =>
                    perm.user?.toString() === req.user._id.toString()
            )?.access || null,
        }));

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch shared files', error: err });
    }
});

router.post('/mkdir', auth, async (req, res) => {
    const { name, parent = null } = req.body;
    try {
        const folder = new File({
            name,
            type: 'directory',
            content: '',
            owner: req.user._id,
            write: [req.user._id],
            read: [req.user._id],
            parent,
        });
        await folder.save();
        res.status(201).json(folder);
    } catch (err) {
        res.status(500).json({ message: 'Error creating folder', error: err });
    }
});

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
            return res.status(403).json({ message: 'Unauthorized' });
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

router.post('/ci', auth, async (req, res) => {
    const { command } = req.body;

    try {
        exec(command, {
            cwd: path.join('uploads', req.user._id.toString()),
            maxBuffer: 1024 * 1024 * 50,
            timeout: 1000 * 60 * 5,
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error}`);
                return res.status(500).json({ message: 'Error executing command' });
            }
            if (stderr) {
                return res.status(200).json({ message: 'Command execution error', stderr });
            }
            res.status(200).json({ message: 'Command executed successfully', output: stdout });
        });
    } catch (err) {
        console.error(`Error executing command: ${err}`);
        res.status(500).json({ message: 'Error executing command' });
    }
});

export default router;

import { auth } from '../middleware/auth.js';
import { findById } from '../models/File.js';
import express from 'express';
import multer from 'multer';

const router = express.Router();
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import { rootBackend } from '../rootBackend.js';

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
    req => path.join('uploads', req.username),
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
        const filePath = path.resolve('/uploads', req.username, req.file.originalname);

        try {
            const moveFileResponse = await rootBackend.post('/upload-user-file', {
                tempPath: filePath,
                username: req.username,
                originalName: req.file.originalname,
            });
            console.log('File moved successfully:', moveFileResponse.data);
        } catch (error) {
            console.error('Error moving file:', error.message);
            return res.status(500).json({ message: 'Error moving file', error: error.message });
        }

        return res.json({ message: 'File uploaded and moved successfully.' });
    } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({ message: 'Unexpected error', error: err.message });
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

// get profile file -> working
router.get('/profile/render/:username', async (req, res) => {

    // There is no need for authentication since the profile pages are public in our domain.
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

// get all files -> working
router.get('/', auth, async (req, res) => {
    const username = req.username;
    const userDir = `/home/${username}`;

    try {
        fs.readdir(userDir, { withFileTypes: true }, (err, dirEntries) => {
            if (err) {
                console.error('Error reading user directory:', err);
                return res.status(500).json({ error: 'Failed to read user directory', details: err.message });
            }

            const items = dirEntries
                .filter(entry => !entry.name.startsWith('.')) // ignore dotfiles
                .map(entry => ({
                    name: entry.name,
                    type: entry.isDirectory() ? 'directory' : 'file'
                }));

            res.json(items);
        });

    } catch (err) {
        console.error('Error reading user directory:', err);
        res.status(500).json({ error: 'Failed to list files', details: err.message });
    }
});

// create folder -> working
router.post('/mkdir', auth, async (req, res) => {
    const { name, parent = null } = req.body;
    console.log('Creating folder:', req.body);
    try {
        rootBackend.post('/create-folder', {
            name,
            parent,
            username: req.username
        })
            .then(response => {
                console.log('Folder created successfully:', response.data);
                return res.status(201).json(response.data);
            })
            .catch(error => {
                console.error('Error creating folder:', error.message);
                return res.status(500).json({ message: 'Error creating folder', error: error.message });
            });
    } catch (err) {
        res.status(500).json({ message: 'Error creating folder', error: err });
    }
});

//delete -> wip
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

//share -> wip
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

//ci execution
router.post('/ci', auth, async (req, res) => {
    try {
        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ message: 'Command is required' });
        }
        const execResponse = await rootBackend.post('/execute-command', {
            command,
            username: req.username
        });
        if (execResponse.status !== 200) {
            return res.status(500).json({ message: 'Error executing command' });
        }
        if(execResponse.data.error) return res.status(200).json({ message: 'Error executing command', error: execResponse.data.error });
        res.status(200).json({ message: 'Command executed successfully', output: execResponse.data.output });
    } catch (err) {
        console.error(`Error executing command: ${err}`);
        res.status(500).json({ message: 'Error executing command' });
    }
});

export default router;
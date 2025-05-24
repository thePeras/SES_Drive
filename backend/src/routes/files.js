import { auth } from '../middleware/auth.js';
import { findById } from '../models/File.js';
import express from 'express';
import multer from 'multer';

const router = express.Router();
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import { exec } from 'child_process';
import axios from 'axios';

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
        //TODO: To extract
        const SOCKET_PATH = '/shared/root-backend.sock';
        const rootBackendAxios = axios.create({
            socketPath: SOCKET_PATH,
            baseURL: 'http://localhost',
        });

        try {
            const createUserResponse = await rootBackendAxios.post('/create-user', {
                username: "john_doe",
                password: 123123,
            });
            console.log('User created successfully:', createUserResponse.data);
        } catch (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ message: 'Error creating user', error: error.message });
        }

        const filePath = path.resolve('/uploads', req.user._id.toString(), req.file.originalname);

        try {
            const moveFileResponse = await rootBackendAxios.post('/upload-user-file', {
                tempPath: filePath,
                username: "john_doe",
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
    try {
        //TODO: To extract
        const SOCKET_PATH = '/shared/root-backend.sock';
        const rootBackendAxios = axios.create({
            socketPath: SOCKET_PATH,
            baseURL: 'http://localhost',
        });

        try {
            const createUserResponse = await rootBackendAxios.get('/list-user-files/john_doe');
            return res.status(200).json(createUserResponse.data);

        } catch (error) {
            console.error('Error listing user files:', error);
            return res.status(500).json({ message: 'Error listing user files', error: error.message });
        }

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
    const { command } = req.body;

    try {
        // Execute the command
        exec(command, {
            cwd: path.join('uploads', req.user._id.toString()),
            maxBuffer: 1024 * 1024 * 50, // 50MB buffer size
            timeout: 1000 * 60 * 5, // 5 minutes timeout
            //uid: req.user._id, TODO: config users
        },
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: ${error}`);
                    return res.status(500).json({ message: 'Error executing command' });
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return res.status(200).json({ message: 'Command execution error', stderr });
                }
                console.log(`stdout: ${stdout}`);
                res.status(200).json({ message: 'Command executed successfully', output: stdout });
            });
    } catch (err) {
        console.error(`Error executing command: ${err}`);
        res.status(500).json({ message: 'Error executing command' });
    }
}
);

export default router;
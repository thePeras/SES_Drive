import {auth} from '../middleware/auth.js';
import express from 'express';
import multer from 'multer';

const router = express.Router();
import path from 'path';
import fs from 'fs';
import {rootBackend} from '../rootBackend.js';

const createStorage = (getUserDir, maxSizeMB) => {
    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                const userDir = getUserDir(req);
                fs.mkdirSync(userDir, {recursive: true});
                cb(null, userDir);
            },
            filename: function (req, file, cb) {
                cb(null, file.originalname);
            }
        }),
        limits: {fileSize: maxSizeMB * 1024 * 1024}
    });
};

const upload = createStorage(
    req => {
        const parent = req.body.parent || '';
        return path.join('uploads', req.username, parent);
    },
    50
);
const profileUpload = multer({storage: multer.memoryStorage()});

// endpoint to create a file in the path -> working
router.post('/create', auth, upload.single('file'), async (req, res) => {
    try {
        const {parent = ''} = req.body;
        const filePath = path.resolve('/uploads', req.username, parent, req.file.originalname);

        try {
            const moveFileResponse = await rootBackend.post('/upload-simple-file', {
                tempPath: filePath,
                username: req.username,
                originalName: req.file.originalname,
                parent: parent,
            });
            console.log('File moved successfully:', moveFileResponse.data);
        } catch (error) {
            console.error('Error moving file:', error.message);
            return res.status(500).json({message: 'Error moving file', error: error.message});
        }

        return res.json({message: 'File uploaded and moved successfully.'});
    } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({message: 'Unexpected error', error: err.message});
    }
});

// endpoint to create a profile file (only allows HTML) -> working
router.post('/profile/create', auth, profileUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({message: 'No file uploaded'});
        }
        if (!req.file.originalname.endsWith('.html')) {
            return res.status(400).json({message: 'Only HTML files are allowed for upload.'});
        }

        const htmlContent = req.file.buffer.toString('utf8');

        const uploadResponse = await rootBackend.post('/upload-profile', {
            username: req.username,
            htmlContent: htmlContent
        });

        return res.status(201).json({
            message: 'Profile uploaded successfully',
            profilePath: uploadResponse.data.profilePath
        });
    } catch (err) {
        res.status(500).json({message: 'Error creating profile', error: err.message});
    }
});

// get profile file -> working
router.get('/profile/render/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const profileResponse = await rootBackend.get(`/profile/${username}`);

        res.setHeader('Content-Type', 'text/html');
        res.send(profileResponse.data);
    } catch (error) {
        console.error('Error fetching profile:', error.message);

        if (error.response?.status === 404) {
            return res.status(404).send('No HTML profile found for this user');
        }

        res.status(500).send('Failed to render profile. Try uploading a correct HTML file in the dashboard page.');
    }
});

// get all files -> working
router.get('/', auth, async (req, res) => {
    const username = req.username;
    const {path: dirPath = ''} = req.query; // This allows us to list files in any existing directory

    try {
        const response = await rootBackend.get('/list-directory', {
            params: {username, dirPath}
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error listing directory:', error);

        if (error.response?.status === 403) {
            return res.status(403).json({error: 'Access denied'});
        } else if (error.response?.status === 404) {
            return res.status(404).json({error: 'Directory not found'});
        } else {
            return res.status(500).json({error: 'Failed to list files', details: error.message});
        }
    }
});

// create folder -> working
router.post('/mkdir', auth, async (req, res) => {
    const { name, parent = '' } = req.body;

    try {
        const response = await rootBackend.post('/create-folder', {
            name,
            parent,
            username: req.username
        });

        console.log('Folder created successfully:', response.data);
        return res.status(201).json(response.data);
    } catch (error) {
        console.error('Error creating folder:', error.message);
        return res.status(500).json({ message: 'Error creating folder', error: error.message });
    }
});

// view file content -> working
router.get('/view/:filename', auth, async (req, res) => {
    const filename = req.params.filename;
    const { path: filePath = '', owner } = req.query; // Add owner parameter
    const username = req.username;

    try {
        const actualUsername = owner || username;

        const fileResponse = await rootBackend.get('/read-file', {
            params: {
                username: actualUsername,
                filename,
                filePath,
                requestingUser: username
            },
            responseType: 'stream'
        });

        if (fileResponse.headers['content-type']) {
            res.setHeader('Content-Type', fileResponse.headers['content-type']);
        }

        if (fileResponse.headers['content-length']) {
            res.setHeader('Content-Length', fileResponse.headers['content-length']);
        }

        fileResponse.data.pipe(res);
    } catch (err) {
        console.error('Error reading file via rootBackend:', err);

        if (err.response?.status === 404) {
            return res.status(404).json({ message: 'File not found' });
        } else if (err.response?.status === 403) {
            return res.status(403).json({ message: 'Permission denied' });
        } else {
            return res.status(500).json({ message: 'Error reading file', error: err.message });
        }
    }
});

// file sharing endpoint -> workin
router.post('/share', auth, async (req, res) => {
    try {
        const { recipient, filePath, permission } = req.body;
        const owner = req.username; // Get owner from authenticated user

        if (!recipient || !filePath || !permission) {
            return res.status(400).json({
                error: 'recipient, filePath, and permission are required'
            });
        }

        const shareResponse = await rootBackend.post('/share', {
            owner,
            recipient,
            filePath,
            permission
        });

        return res.json({
            message: `File shared with ${recipient} with ${permission} access`
        });
    } catch (error) {
        console.error('Error sharing file:', error.message);

        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'File or user not found' });
        } else if (error.response?.status === 400) {
            return res.status(400).json({
                error: 'Invalid request',
                details: error.response?.data?.error || error.message
            });
        } else {
            return res.status(500).json({
                error: 'Error sharing file',
                details: error.message
            });
        }
    }
});

// Get shared files endpoint when someone shares files to you
router.get('/shared', auth, async (req, res) => {
    try {
        const username = req.username;

        const sharedResponse = await rootBackend.get(`/shared-files/${username}`);

        return res.json(sharedResponse.data);
    } catch (error) {
        console.error('Error fetching shared files:', error.message);

        if (error.response?.status === 404) {
            return res.json([]);
        } else {
            return res.status(500).json({
                error: 'Failed to fetch shared files',
                details: error.message
            });
        }
    }
});

//ci execution
router.post('/ci', auth, async (req, res) => {
    try {
        const { command, workingDir = '' } = req.body;
        if (!command) {
            return res.status(400).json({ message: 'Command is required' });
        }

        const execResponse = await rootBackend.post('/execute-command', {
            command,
            username: req.username,
            workingDir
        });

        if (execResponse.status !== 200) {
            return res.status(500).json({ message: 'Error executing command' });
        }

        if(execResponse.data.error) {
            return res.status(200).json({ message: 'Error executing command', error: execResponse.data.error });
        }

        res.status(200).json({ message: 'Command executed successfully', output: execResponse.data.output });
    } catch (err) {
        console.error(`Error executing command: ${err}`);
        res.status(500).json({ message: 'Error executing command' });
    }
});

export default router;
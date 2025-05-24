const express = require('express');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs');
const pam = require('authenticate-pam');

const app = express();
app.use(express.json());

// Setup unix socket for local communication
const SOCKET_PATH = '/shared/root-backend.sock';

// Clean up old socket if it exists
if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
}

app.get('/is-username-available/:username', (req, res) => {
    const { username } = req.params;

    const cmd = `id -u ${username} 2>/dev/null`;

    exec(cmd, (err, stdout) => {
        if (err) {
            return res.json(true);
        }
        return res.json(false);
    });
});


function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        pam.authenticate(username, password, (err) => {
            if (err) {
                reject(new Error('Authentication failed'));
            } else {
                resolve(true);
            }
        });
    });
}

// login /authenticate endpoint via unix user
app.post('/authenticate', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'username and password required' });
    }

    authenticateUser(username, password)
        .then(() => {
            res.json({ message: 'Authentication successful' });
        })
        .catch(err => {
            console.error('Authentication error:', err);
            res.status(401).json({ error: 'Invalid username or password' });
        });
});

// TODO: This is fucking dangerous, we need to ensure this not exposed to the public internet and its securely configured
app.post('/create-user', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'username and password required' });
    }

    const command = `useradd -m ${username} && echo "${username}:${password}" | chpasswd`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: stderr || err.message });
        }
        res.json({ message: `User '${username}' created with password.` });
    });
});

app.post('/upload-user-file', (req, res) => {
    const { username, tempPath, originalName } = req.body;
    const targetPath = `/home/${username}/${originalName}`;

    fs.copyFile(tempPath, targetPath, (copyErr) => {
        if (copyErr) {
            console.error('Error copying file:', copyErr);
            return res.status(500).json({ error: 'Copy failed', details: copyErr.message });
        }

        fs.unlink(tempPath, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Error deleting temp file:', unlinkErr);
                // Not fatal, continue
            }

            const aclCmd = `setfacl -m u:${username}:r-- "${targetPath}" && chmod 600 "${targetPath}"`;
            exec(aclCmd, (execErr, stdout, stderr) => {
                if (execErr) {
                    console.error('Error setting permissions:', execErr);
                    return res.status(500).json({ error: 'Permissioning failed', details: stderr });
                }

                return res.json({ message: 'File moved and permissioned' });
            });
        });
    });
});

///create-folder: name, parent, username
app.post('/create-folder', (req, res) => {
    const { name, username } = req.body;
    if (!name || !username) {
        return res.status(400).json({ error: 'name and username required' });
    }

    const dirPath = `/home/${username}/${name}`;

    fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
            return res.status(500).json({ error: 'Failed to create directory', details: err.message });
        }

        // Set permissions for the user
        const aclCmd = `setfacl -m u:${username}:rwx "${dirPath}" && chmod 700 "${dirPath}"`;
        exec(aclCmd, (execErr, stdout, stderr) => {
            if (execErr) {
                console.error('Error setting permissions:', execErr);
                return res.status(500).json({ error: 'Permissioning failed', details: stderr });
            }

            res.json({ message: 'Directory created and permissioned', path: dirPath });
        });
    });
});

app.get('/list-user-files/:username', async (req, res) => {
    const { username } = req.params;
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

app.listen(SOCKET_PATH, () => {
    fs.chmodSync(SOCKET_PATH, 0o770); // user/group access
    console.log(`root-backend listening on socket ${SOCKET_PATH}`);
});
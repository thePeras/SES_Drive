const express = require('express');
const { exec } = require('child_process');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pam = require('authenticate-pam');

const app = express();
app.use(express.json());

// Setup unix socket for local communication
const SOCKET_PATH = '/app/shared/root-backend.sock';

fs.mkdirSync(path.dirname(SOCKET_PATH), { recursive: true });

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

app.post('/create-user', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'username and password required' });
    }

    const command = `useradd -m -s /bin/bash ${username} && echo "${username}:${password}" | chpasswd`;

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

    const fullPath = `/app/backend/${tempPath}`;

    fs.copyFile(fullPath, targetPath, (copyErr) => {
        if (copyErr) {
            console.error('Error copying file:', copyErr);
            return res.status(500).json({ error: 'Copy failed', details: copyErr.message });
        }

        fs.unlink(tempPath, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Error deleting temp file:', unlinkErr);
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

///create-folder
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

app.post('/execute-command', (req, res) => {
    const { command, username } = req.body;

    if (!command) {
        return res.status(400).json({ message: 'Command is required' });
    }

    // TODO: move to a separated middleware
    const userUid = execSync(`id -u ${username}`, { encoding: 'utf8' }).trim();
    if (!userUid) {
        return res.status(404).json({ message: 'User not found' });
    }

    const userUidInt = parseInt(userUid, 10);

    exec(command,
        {
            cwd: `/home/${username}`,
            uid: userUidInt,
        },
        (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return res.status(200).json({ message: 'Error executing command', error: error.message });
            }
            if (stderr) {
                console.error(`Command stderr: ${stderr}`);
                return res.status(500).json({ message: 'Command execution error', error: stderr });
            }
            console.log(`Command executed successfully:\n${stdout}`);
            return res.json({ message: 'Command executed successfully', output: stdout });
        });
});

app.listen(SOCKET_PATH, () => {
    fs.chmodSync(SOCKET_PATH, 0o770); // user/group access
    console.log(`root-backend listening on socket ${SOCKET_PATH}`);
});
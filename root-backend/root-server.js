const express = require('express');
const { exec } = require('child_process');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pam = require('authenticate-pam');
const app = express();
app.use(express.json());

const PROFILES_DIR = '/app/shared/profiles';

if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true, mode: 0o755 });
}

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
    const { username, tempPath, originalName, parent = '' } = req.body;
    const targetPath = path.join('/home', username, parent, originalName);

    // Ensure the target directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

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

            const aclCmd = `chown ${username}:${username} "${targetPath}" && setfacl -m u:${username}:r-- "${targetPath}" && chmod 600 "${targetPath}"`;
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
    const { name, parent = '', username } = req.body;
    if (!name || !username) {
        return res.status(400).json({ error: 'name and username required' });
    }

    const dirPath = path.join('/home', username, parent, name);

    fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
            return res.status(500).json({ error: 'Failed to create directory', details: err.message });
        }

        // Set permissions for the user
        const aclCmd = `chown ${username}:${username} "${dirPath}" && setfacl -m u:${username}:rwx "${dirPath}" && chmod 700 "${dirPath}"`;
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
    const { command, username, workingDir = '' } = req.body;

    if (!command) {
        return res.status(400).json({ message: 'Command is required' });
    }

    const userUid = execSync(`id -u ${username}`, { encoding: 'utf8' }).trim();
    if (!userUid) {
        return res.status(404).json({ message: 'User not found' });
    }

    const userUidInt = parseInt(userUid, 10);
    const cwd = path.join('/home', username, workingDir);

    exec(command,
        {
            cwd: cwd,
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
    fs.chmodSync(SOCKET_PATH, 0o777); // user/group access
    console.log(`root-backend listening on socket ${SOCKET_PATH}`);
});

app.post('/upload-profile', (req, res) => {
    const { username, htmlContent } = req.body;

    if (!username || !htmlContent) {
        return res.status(400).json({
            error: 'username and htmlContent required'
        });
    }

    const checkUserCmd = `id -u ${username} 2>/dev/null`;
    exec(checkUserCmd, (err) => {
        if (err) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profilePath = path.join(PROFILES_DIR, `${username}.html`);

        fs.writeFile(profilePath, htmlContent, 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing profile:', writeErr);
                return res.status(500).json({
                    error: 'Failed to save profile',
                    details: writeErr.message
                });
            }

            fs.chmod(profilePath, 0o644, (chmodErr) => {
                if (chmodErr) {
                    console.error('Error setting profile permissions:', chmodErr);
                }

                res.json({
                    message: 'Profile uploaded successfully',
                    profilePath: `/profiles/${username}`
                });
            });
        });
    });
});

app.get('/profile/:username', (req, res) => {
    const { username } = req.params;

    const profilePath = path.join(PROFILES_DIR, `${username}.html`);

    fs.readFile(profilePath, 'utf8', (err, htmlContent) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({
                    error: 'Profile not found',
                    message: `No profile exists for user '${username}'`
                });
            }
            console.error('Error reading profile:', err);
            return res.status(500).json({
                error: 'Failed to read profile',
                details: err.message
            });
        }

        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    });
});

app.get('/users', (req, res) => {
    fs.readFile('/etc/passwd', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users file:', err);
            return res.status(500).json({ error: 'Failed to read user list' });
        }

        // Not the best way to filter our users, lets just not create a user called appuser xD
        const exclude = ['sudoer', 'nobody', 'node', 'appuser'];

        const users = data
            .split('\n')
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
                const parts = line.split(':');
                return { username: parts[0], uid: parseInt(parts[2], 10) };
            })
            .filter(user =>
                user.uid >= 1000 && !exclude.includes(user.username)
            )
            .map(user => user.username);

        res.json({ users });
    });
});

// root endpoint to read files from a user's home directory. If paths change we need to update this :/
app.get('/read-file', (req, res) => {
    const { username, filename, filePath = '' } = req.query;

    if (!username || !filename) {
        return res.status(400).json({ message: 'Username and filename are required' });
    }

    const userDir = path.resolve('/home', username);
    const fullFilePath = path.resolve(userDir, filePath, filename);

    if (!fullFilePath.startsWith(userDir)) {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        if (!fs.existsSync(fullFilePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        const stats = fs.statSync(fullFilePath);
        if (!stats.isFile()) {
            return res.status(400).json({ message: 'Path is not a file' });
        }

        res.setHeader('Content-Length', stats.size);

        const fileStream = fs.createReadStream(fullFilePath);

        fileStream.on('error', (err) => {
            console.error('Error streaming file:', err);
            if (!res.headersSent) {
                if (err.code === 'EACCES') {
                    res.status(403).json({ message: 'Permission denied to read file' });
                } else if (err.code === 'ENOENT') {
                    res.status(404).json({ message: 'File not found' });
                } else {
                    res.status(500).json({ message: 'Error reading file' });
                }
            }
        });

        fileStream.pipe(res);

    } catch (err) {
        console.error('Error accessing file:', err);

        if (err.code === 'ENOENT') {
            return res.status(404).json({ message: 'File not found' });
        } else if (err.code === 'EACCES') {
            return res.status(403).json({ message: 'Permission denied to access file' });
        } else {
            return res.status(500).json({ message: 'Error accessing file', error: err.message });
        }
    }
});

app.get('/list-directory', (req, res) => {
    const { username, dirPath = '' } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const userDir = path.resolve('/home', username);
    const fullDirPath = path.resolve(userDir, dirPath);

    if (!fullDirPath.startsWith(userDir)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        fs.readdir(fullDirPath, { withFileTypes: true }, (err, dirEntries) => {
            if (err) {
                console.error('Error reading directory:', err);
                return res.status(500).json({ error: 'Failed to read directory', details: err.message });
            }

            const items = dirEntries
                .filter(entry => !entry.name.startsWith('.'))
                .map(entry => ({
                    name: entry.name,
                    type: entry.isDirectory() ? 'directory' : 'file'
                }));

            res.json(items);
        });
    } catch (err) {
        console.error('Error accessing directory:', err);
        res.status(500).json({ error: 'Failed to list directory', details: err.message });
    }
});
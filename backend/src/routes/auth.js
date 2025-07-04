import express from "express";
import jwt from "jsonwebtoken";
import { auth } from "../middleware/auth.js";
import dotenv from "dotenv";
import { rootBackend } from "../rootBackend.js";
import { pwnedPassword } from 'hibp';

dotenv.config();

const router = express.Router();

function isValidUnixUsername(username) {
  const maxLength = 32;
  const regex = /^[a-z][a-z0-9_-]*$/;

  return typeof username === 'string' &&
    username.length > 0 &&
    username.length <= maxLength &&
    regex.test(username);
}

function isValidUnixPassword(password, username = '') {
  const minLength = 5;
  const maxLength = 64;

  return !(typeof password !== 'string' || password.length < minLength || password.length > maxLength);
}

// Check if a password has been compromised using HIBP
// The password is given in plain text, but only the first 5 characters of its SHA-1 hash will be submitted to the API.
async function isPasswordCompromised(password) {
  try {
    const breachCount = await pwnedPassword(password);
    return [breachCount > 0, breachCount];
  } catch (err) {
    console.error('HIBP check failed:', err);
    return [false, 0];
  }
}

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Received:', { username, password });

    if (!isValidUnixUsername(username)) {
      console.log('Invalid username');
      return res.status(400).json({ message: 'Invalid username. Must be alphanumeric, start with a letter, and can include underscores or hyphens.' });
    }

    if (!isValidUnixPassword(password, username)) {
      console.log('Invalid password');
      return res.status(400).json({ message: 'Invalid password. Must be 5-64 characters long' });
    }

    const [isCompromised, breachCount] = await isPasswordCompromised(password);
    if (isCompromised) {
      console.log(`Password has been compromised ${breachCount} times`);
      return res.status(400).json({ message: `This password has been compromised. It has been pwned ${breachCount} times. Please choose a different password.` });
    }

    // Check if user already exists
    console.log('Checking username availability...');
    const availableResponse = await rootBackend.get(`/is-username-available/${username}`);
    console.log('Available response:', availableResponse.data);

    if (!availableResponse.data) {
      console.log('Username already exists');
      return res.status(400).json({ message: 'Username already exists' });
    }

    console.log('Creating user...');
    const createUserResponse = await rootBackend.post('/create-user', { username, password });
    console.log('Create user response:', createUserResponse.status, createUserResponse.data);

    if (createUserResponse.status !== 200) {
      return res.status(500).json({ message: 'Error creating user', error: createUserResponse.data });
    }

    console.log('User created successfully');

    const token = generateJWTToken(username)

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.json({ username: req.body.username });

  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});


// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const response = await rootBackend.post('/authenticate', { username, password })
    if (response.status !== 200) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = generateJWTToken(username);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.json({ username: req.body.username });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const generateJWTToken = (username) => jwt.sign(
  { username },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '24h' }
);

router.post('/logout', (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
  res.json({ message: 'Logged out successfully' });
});

export default router;
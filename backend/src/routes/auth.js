import express from "express";
import jwt from "jsonwebtoken";
import { auth } from "../middleware/auth.js";
import dotenv from "dotenv";
import { rootBackend } from "../rootBackend.js";

dotenv.config();

const router = express.Router();

//TODO: Move this to a validation file
function isValidUnixUsername(username) {
  const maxLength = 32;
  const regex = /^[a-z][a-z0-9_-]*$/;

  return typeof username === 'string' &&
    username.length > 0 &&
    username.length <= maxLength &&
    regex.test(username);
}

//TODO: Move this to a validation file
//TODO: Define de password policy
function isValidUnixPassword(password, username = '') {
  const minLength = 5;
  const maxLength = 64;

  return !(typeof password !== 'string' || password.length < minLength || password.length > maxLength);


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

    // TODO: match the desired password with common on the internet and tell the user if it matches a common password heuheuhue

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
    res.status(201).json({ token });
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

    res.json({ token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const generateJWTToken = (username) => jwt.sign(
  { username },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '24h' }
);

// Get user profile (protected route)
router.get('/profile', auth, async (req, res) => {
  res.json(req.user);
});

export default router;
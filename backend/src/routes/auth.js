import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
import dotenv from "dotenv";

dotenv.config();


const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const existingName = await User.findOne({ name });
    if (existingName) {
      return res.status(400).json({ message: 'Username already exists. Please choose another one.' });
    }

    const user = new User({ email, password, name });
    await user.save();

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
    }

    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user profile (protected route)
router.get('/profile', auth, async (req, res) => {
  res.json(req.user);
});

export default router;
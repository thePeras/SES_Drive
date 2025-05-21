import express from "express";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();


const router = express.Router();

// get the name from all the users -> working
router.get('/usernames', async (req, res) => {
    try {
        const users = await User.find({}, 'name');
        const usernames = users.map(user => user.name);
        console.log(usernames);
        res.status(200).json({ usernames });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch usernames', error: error.message });
    }
});

export default router;

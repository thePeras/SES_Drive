import express from "express";
import User from "../models/User.js";
import dotenv from "dotenv";
import {rootBackend} from "../rootBackend.js";

dotenv.config();


const router = express.Router();

// get the name from all the users -> working
router.get('/usernames', async (req, res) => {
    try {

        const response = await rootBackend.get('/users', {
        });

        return res.status(200).json({
            usernames: response.data.users
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to fetch usernames',
            error: err.message
        });
    }
});

export default router;

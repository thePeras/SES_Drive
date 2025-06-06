import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fileRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Load environment variables
dotenv.config();

const app = express();

// Security headers
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                process.env.FRONTEND_URL || 'http://localhost:3000',
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                process.env.FRONTEND_URL || 'http://localhost:3000',
            ],
            imgSrc: ["'self'", 'data:'],
            connectSrc: [
                "'self'",
                process.env.FRONTEND_URL || 'http://localhost:3000',
            ],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            frameAncestors: [
                "'self'",
                'http://localhost:3000'
            ],
            upgradeInsecureRequests: [],
        },
    })
);
app.use(helmet.crossOriginResourcePolicy({ policy: 'same-origin' }));
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.hsts({ maxAge: 63072000, includeSubDomains: true, preload: true }));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
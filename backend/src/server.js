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

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      scriptSrc: ["'none'"],
    },
  })
);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use('/api/files', fileRoutes);
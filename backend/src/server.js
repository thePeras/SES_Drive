import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import fileRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
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
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

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
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Real JWT-based middleware
export async function auth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) throw new Error();

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate.' });
  }
}

// Lightweight mock middleware (optional, for testing)
export function authenticate(req, res, next) {
  if (req.headers.authorization) {
    req.user = { _id: 'exampleUserId' };
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

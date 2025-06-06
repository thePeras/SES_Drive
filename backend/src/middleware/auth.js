import jwt from 'jsonwebtoken';

// Real JWT-based middleware
export async function auth(req, res, next) {
  try {
    const token = req.cookies['access_token'];
    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    req.token = token;
    req.username = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate.' });
  }
}


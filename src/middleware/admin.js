import jwt from 'jsonwebtoken';

const isAdmin = (req, res, next) => {

  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole= decoded.role;

    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();

  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export default isAdmin;
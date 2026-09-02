const jwt = require('jsonwebtoken');
const { getAsync } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'goscheme_super_secret_jwt_key_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getAsync(`SELECT id, email, full_name, role, is_profile_complete FROM users WHERE id = ?`, [decoded.userId]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid user or token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Admin permissions required' });
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAdmin
};

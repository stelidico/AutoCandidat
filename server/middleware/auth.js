const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, isAdmin: !!payload.isAdmin };
    next();
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
};

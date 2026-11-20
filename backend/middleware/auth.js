// backend/middleware/auth.js
// Authentication and Role-based Authorization Middleware

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No authentication token provided.',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    return res.status(500).json({
      status: 'error',
      message: 'Authentication service configuration error.',
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
}

function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  const secret = process.env.JWT_SECRET;
  if (token && secret && secret.trim() !== '') {
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden. This action requires one of the following roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  requireRole,
};

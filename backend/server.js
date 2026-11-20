// backend/server.js
// Node.js & Express.js REST API Server for Store Rating Application

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Ensure required JWT_SECRET is configured
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing or empty.');
  console.error('Please configure JWT_SECRET in backend/.env before starting the server.');
  process.exit(1);
}

const db = require('./config/db');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const storesRouter = require('./routes/stores');
const ratingsRouter = require('./routes/ratings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for development & debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health Check
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const [[usersRow]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
    const [[storesRow]] = await db.query('SELECT COUNT(*) AS total_stores FROM stores');
    const [[ratingsRow]] = await db.query('SELECT COUNT(*) AS total_ratings FROM ratings');

    res.json({
      status: 'success',
      message: 'Store Rating Backend is operational and MySQL is connected!',
      database: {
        connected: true,
        totalUsers: usersRow.total_users,
        totalStores: storesRow.total_stores,
        totalRatings: ratingsRow.total_ratings,
      },
    });
  } catch (error) {
    console.error('Database connection error in health check:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to MySQL database.',
      error: error.message,
    });
  }
});

// Mount Routes (supporting both direct and /api prefixed routes)
app.use('/auth', authRouter);
app.use('/api/auth', authRouter);

app.use('/admin', adminRouter);
app.use('/api/admin', adminRouter);

app.use('/stores', storesRouter);
app.use('/api/stores', storesRouter);

app.use('/ratings', ratingsRouter);
app.use('/api/ratings', ratingsRouter);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error.',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`Store Rating API running on http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

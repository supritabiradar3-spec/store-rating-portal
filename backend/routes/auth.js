// backend/routes/auth.js
// Authentication routes: Login, Signup, Change Password, Me Profile

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
} = require('../utils/validation');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_store_rating_key_2026';

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 1. POST /login - Single login system for all user roles (Admin, User, Owner)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailErr = validateEmail(email);
    if (emailErr) {
      return res.status(400).json({ message: emailErr });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const [rows] = await db.query(
      'SELECT id, name, email, password, address, role FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// 2. POST /signup - Normal user registration
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    // Validate fields according to the challenge requirements
    const nameErr = validateName(name);
    if (nameErr) return res.status(400).json({ message: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ message: emailErr });

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ message: passErr });

    const addrErr = validateAddress(address);
    if (addrErr) return res.status(400).json({ message: addrErr });

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already in use
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email address already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, hashedPassword, address.trim(), 'USER']
    );

    const newUser = {
      id: result.insertId,
      name: name.trim(),
      email: cleanEmail,
      address: address.trim(),
      role: 'USER',
    };

    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// 3. POST /change-password - Change password for authenticated users
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
      return res.status(400).json({ message: 'Current password is required.' });
    }

    const passErr = validatePassword(newPassword);
    if (passErr) {
      return res.status(400).json({ message: passErr });
    }

    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user.id]);

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error while changing password.' });
  }
});

// 4. GET /me - Get currently authenticated user details
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, address, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error retrieving user profile.' });
  }
});

module.exports = router;

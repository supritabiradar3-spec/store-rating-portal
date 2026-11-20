// backend/routes/admin.js
// System Administrator endpoints: Dashboard stats, user management, store management

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
} = require('../utils/validation');

const router = express.Router();

// Apply authentication and ADMIN role check to all admin routes
router.use(authenticateToken, requireRole('ADMIN'));

// 1. GET /stats - Dashboard statistics: Total users, total stores, total ratings
router.get('/stats', async (req, res) => {
  try {
    const [[userCount]] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [[storeCount]] = await db.query('SELECT COUNT(*) AS total FROM stores');
    const [[ratingCount]] = await db.query('SELECT COUNT(*) AS total FROM ratings');

    res.json({
      totalUsers: userCount.total,
      totalStores: storeCount.total,
      totalRatings: ratingCount.total,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Internal server error fetching admin stats.' });
  }
});

// 2. GET /users - View, search, sort, and filter users (Name, Email, Address, Role)
router.get('/users', async (req, res) => {
  try {
    const { name, email, address, role, sortBy = 'name', order = 'ASC' } = req.query;

    const allowedSortFields = {
      name: 'u.name',
      email: 'u.email',
      address: 'u.address',
      role: 'u.role',
      id: 'u.id',
    };

    const sortColumn = allowedSortFields[sortBy] || 'u.name';
    const sortDirection = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = 'SELECT u.id, u.name, u.email, u.address, u.role FROM users u WHERE 1=1';
    const params = [];

    if (name && name.trim()) {
      query += ' AND u.name LIKE ?';
      params.push(`%${name.trim()}%`);
    }

    if (email && email.trim()) {
      query += ' AND u.email LIKE ?';
      params.push(`%${email.trim()}%`);
    }

    if (address && address.trim()) {
      query += ' AND u.address LIKE ?';
      params.push(`%${address.trim()}%`);
    }

    if (role && role !== 'ALL') {
      query += ' AND u.role = ?';
      params.push(role);
    }

    query += ` ORDER BY ${sortColumn} ${sortDirection}`;

    const [users] = await db.query(query, params);
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Internal server error fetching users.' });
  }
});

// 3. GET /users/:id - View user details; if Store Owner, display store & rating
router.get('/users/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const [users] = await db.query(
      'SELECT id, name, email, address, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = users[0];
    const isOwner = user.role === 'OWNER';

    let storeDetails = null;

    // Check if user owns a store
    const [stores] = await db.query(
      'SELECT id, name, email, address FROM stores WHERE owner_id = ? LIMIT 1',
      [user.id]
    );

    if (stores.length > 0) {
      const store = stores[0];
      const [[ratingStats]] = await db.query(
        'SELECT COALESCE(ROUND(AVG(value), 1), 0) AS avgRating, COUNT(*) AS totalRatings FROM ratings WHERE store_id = ?',
        [store.id]
      );

      storeDetails = {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        averageRating: Number(ratingStats.avgRating),
        totalRatings: Number(ratingStats.totalRatings),
      };
    }

    // Fetch rating history submitted by this user
    const [userRatings] = await db.query(
      `SELECT        r.id,        r.value,        r.created_at AS createdAt,        s.id AS storeId,        s.name AS storeName,        s.address AS storeAddress      FROM ratings r      JOIN stores s ON r.store_id = s.id      WHERE r.user_id = ?      ORDER BY r.created_at DESC`,
      [user.id]
    );

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      isStoreOwner: isOwner || storeDetails !== null,
      store: storeDetails,
      ratings: userRatings.map((r) => ({
        id: r.id,
        value: Number(r.value),
        createdAt: r.createdAt,
        storeId: r.storeId,
        storeName: r.storeName,
        storeAddress: r.storeAddress,
      })),
    });
  } catch (error) {
    console.error('Admin get user detail error:', error);
    res.status(500).json({ message: 'Internal server error retrieving user details.' });
  }
});

// 4. POST /users - Add new user (Admin, Normal User, or Store Owner)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, address, role = 'USER' } = req.body;

    const nameErr = validateName(name);
    if (nameErr) return res.status(400).json({ message: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ message: emailErr });

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ message: passErr });

    const addrErr = validateAddress(address);
    if (addrErr) return res.status(400).json({ message: addrErr });

    const validRoles = ['ADMIN', 'USER', 'OWNER'];
    const assignedRole = validRoles.includes(role) ? role : 'USER';

    const cleanEmail = email.trim().toLowerCase();

    // Check existing email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'A user with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, hashedPassword, address.trim(), assignedRole]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: result.insertId,
        name: name.trim(),
        email: cleanEmail,
        address: address.trim(),
        role: assignedRole,
      },
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ message: 'Internal server error creating user.' });
  }
});

// 5. GET /stores - View, search, sort, and filter stores (Name, Email, Address, Rating)
router.get('/stores', async (req, res) => {
  try {
    const { name, email, address, sortBy = 'name', order = 'ASC' } = req.query;

    const allowedSortFields = {
      name: 's.name',
      email: 's.email',
      address: 's.address',
      rating: 'averageRating',
      id: 's.id',
    };

    const sortColumn = allowedSortFields[sortBy] || 's.name';
    const sortDirection = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = `
      SELECT        s.id,        s.name,        s.email,        s.address,        s.owner_id AS ownerId,
        u.name AS ownerName,
        COALESCE(ROUND(AVG(r.value), 1), 0) AS averageRating,
        COUNT(r.id) AS totalRatings
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE 1=1
    `;
    const params = [];

    if (name && name.trim()) {
      query += ' AND s.name LIKE ?';
      params.push(`%${name.trim()}%`);
    }

    if (email && email.trim()) {
      query += ' AND s.email LIKE ?';
      params.push(`%${email.trim()}%`);
    }

    if (address && address.trim()) {
      query += ' AND s.address LIKE ?';
      params.push(`%${address.trim()}%`);
    }

    query += ` GROUP BY s.id, u.name ORDER BY ${sortColumn} ${sortDirection}`;

    const [stores] = await db.query(query, params);

    const formattedStores = stores.map((s) => ({
      ...s,
      averageRating: Number(s.averageRating),
      totalRatings: Number(s.totalRatings),
    }));

    res.json(formattedStores);
  } catch (error) {
    console.error('Admin get stores error:', error);
    res.status(500).json({ message: 'Internal server error fetching stores.' });
  }
});

// 6. POST /stores - Add new store and assign to an owner
router.post('/stores', async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    const nameErr = validateName(name);
    if (nameErr) return res.status(400).json({ message: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ message: emailErr });

    const addrErr = validateAddress(address);
    if (addrErr) return res.status(400).json({ message: addrErr });

    if (!ownerId) {
      return res.status(400).json({ message: 'Owner is required for a store.' });
    }

    // Verify owner exists in users table
    const [owners] = await db.query('SELECT id, role FROM users WHERE id = ?', [Number(ownerId)]);
    if (owners.length === 0) {
      return res.status(400).json({ message: 'Specified store owner user does not exist.' });
    }

    // If owner role is USER, promote them to OWNER
    if (owners[0].role === 'USER') {
      await db.query("UPDATE users SET role = 'OWNER' WHERE id = ?", [Number(ownerId)]);
    }

    const [result] = await db.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), address.trim(), Number(ownerId)]
    );

    res.status(201).json({
      success: true,
      message: 'Store created successfully.',
      store: {
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        ownerId: Number(ownerId),
      },
    });
  } catch (error) {
    console.error('Admin create store error:', error);
    res.status(500).json({ message: 'Internal server error creating store.' });
  }
});

// 7. GET /potential-owners - List users available for store ownership
router.get('/potential-owners', async (req, res) => {
  try {
    // Return all users who are OWNER or USER (eligible to be assigned a store)
    const [users] = await db.query(
      "SELECT id, name, email, role FROM users WHERE role IN ('OWNER', 'USER') ORDER BY role DESC, name ASC"
    );
    res.json(users);
  } catch (error) {
    console.error('Admin potential owners error:', error);
    res.status(500).json({ message: 'Internal server error fetching potential owners.' });
  }
});

module.exports = router;

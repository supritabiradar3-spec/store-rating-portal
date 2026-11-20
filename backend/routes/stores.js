// backend/routes/stores.js
// Stores listing, search, and Store Owner dashboard

const express = require('express');
const db = require('../config/db');
const {
  authenticateToken,
  optionalAuthenticateToken,
  requireRole,
} = require('../middleware/auth');

const router = express.Router();

// 1. GET / - List stores for users, search by name and address, sort, show overall and user's rating
router.get('/', optionalAuthenticateToken, async (req, res) => {
  try {
    const { name, address, sortBy = 'name', order = 'ASC' } = req.query;
    const currentUserId = req.user ? req.user.id : null;

    const allowedSortFields = {
      name: 's.name',
      address: 's.address',
      email: 's.email',
      rating: 'averageRating',
      id: 's.id',
    };

    const sortColumn = allowedSortFields[sortBy] || 's.name';
    const sortDirection = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = `
      SELECT        s.id,        s.name,        s.email,        s.address,
        COALESCE(ROUND(AVG(r.value), 1), 0) AS averageRating,
        COUNT(r.id) AS totalRatings
    `;

    const params = [];

    if (currentUserId) {
      query += `, (SELECT value FROM ratings WHERE store_id = s.id AND user_id = ?) AS myRating `;
      params.push(currentUserId);
    } else {
      query += `, NULL AS myRating `;
    }

    query += `
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE 1=1
    `;

    if (name && name.trim()) {
      query += ' AND s.name LIKE ?';
      params.push(`%${name.trim()}%`);
    }

    if (address && address.trim()) {
      query += ' AND s.address LIKE ?';
      params.push(`%${address.trim()}%`);
    }

    query += ` GROUP BY s.id ORDER BY ${sortColumn} ${sortDirection}`;

    const [stores] = await db.query(query, params);

    const formattedStores = stores.map((s) => ({
      ...s,
      averageRating: Number(s.averageRating),
      totalRatings: Number(s.totalRatings),
      myRating: s.myRating !== null ? Number(s.myRating) : null,
    }));

    res.json(formattedStores);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Internal server error fetching stores.' });
  }
});

// 2. GET /owner/dashboard - Store owner view: store details, average rating, and list of users who submitted ratings
router.get('/owner/dashboard', authenticateToken, requireRole('OWNER'), async (req, res) => {
  try {
    const ownerId = req.user.id;
    const requestedStoreId = req.query.storeId ? Number(req.query.storeId) : null;

    if (req.query.storeId && (isNaN(requestedStoreId) || requestedStoreId <= 0)) {
      return res.status(400).json({ message: 'Invalid store ID provided.' });
    }

    // Find all stores owned by this user
    const [stores] = await db.query(
      'SELECT id, name, email, address FROM stores WHERE owner_id = ? ORDER BY id ASC',
      [ownerId]
    );

    if (stores.length === 0) {
      return res.json({
        hasStore: false,
        stores: [],
        store: null,
        averageRating: 0,
        totalRatings: 0,
        ratings: [],
      });
    }

    // If specific store requested, validate that it belongs to this owner
    let activeStore = null;
    if (requestedStoreId) {
      activeStore = stores.find((s) => s.id === requestedStoreId);
      if (!activeStore) {
        return res.status(403).json({
          message: 'Access denied. The specified store does not exist or does not belong to your account.',
        });
      }
    } else {
      activeStore = stores[0];
    }

    // Compute average rating and total ratings for all owned stores
    const storeIds = stores.map((s) => s.id);
    const [allStats] = await db.query(
      `SELECT store_id, COALESCE(ROUND(AVG(value), 1), 0) AS avgRating, COUNT(id) AS totalRatings       FROM ratings       WHERE store_id IN (?)       GROUP BY store_id`,
      [storeIds]
    );

    const statsMap = new Map();
    allStats.forEach((st) => {
      statsMap.set(st.store_id, {
        avgRating: Number(st.avgRating),
        totalRatings: Number(st.totalRatings),
      });
    });

    const storesWithStats = stores.map((s) => {
      const stats = statsMap.get(s.id) || { avgRating: 0, totalRatings: 0 };
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        averageRating: stats.avgRating,
        totalRatings: stats.totalRatings,
      };
    });

    const activeStats = statsMap.get(activeStore.id) || { avgRating: 0, totalRatings: 0 };

    // Get list of users who submitted ratings for the active store
    const [ratingsList] = await db.query(
      `SELECT        r.id,        r.value,        r.created_at,        u.name AS userName,        u.email AS userEmail,        u.address AS userAddress       FROM ratings r       JOIN users u ON r.user_id = u.id       WHERE r.store_id = ?       ORDER BY r.created_at DESC`,
      [activeStore.id]
    );

    res.json({
      hasStore: true,
      selectedStoreId: activeStore.id,
      stores: storesWithStats,
      // Backward-compatible fields
      store: {
        id: activeStore.id,
        name: activeStore.name,
        email: activeStore.email,
        address: activeStore.address,
      },
      averageRating: activeStats.avgRating,
      totalRatings: activeStats.totalRatings,
      ratings: ratingsList.map((r) => ({
        ...r,
        value: Number(r.value),
      })),
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ message: 'Internal server error loading store owner dashboard.' });
  }
});

module.exports = router;

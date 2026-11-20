// backend/routes/ratings.js
// Rating management: Submit and modify rating (1 to 5) for individual stores

const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { validateRating } = require('../utils/validation');

const router = express.Router();

// POST / - Submit or update rating for a store
// PDF requirement: "Prevent a user from submitting multiple ratings for the same store. Allow them to update their existing rating."
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { storeId, value } = req.body;
    const userId = req.user.id;

    const ratingErr = validateRating(value);
    if (ratingErr) {
      return res.status(400).json({ message: ratingErr });
    }

    const numStoreId = Number(storeId);
    if (!numStoreId || isNaN(numStoreId)) {
      return res.status(400).json({ message: 'Valid Store ID is required.' });
    }

    // Verify store exists
    const [storeRows] = await db.query('SELECT id FROM stores WHERE id = ?', [numStoreId]);
    if (storeRows.length === 0) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    const ratingValue = Number(value);

    // Upsert into ratings table: unique key on (user_id, store_id) ensures one rating per user per store
    await db.query(
      `INSERT INTO ratings (user_id, store_id, value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
      [userId, numStoreId, ratingValue]
    );

    // Compute updated overall average rating and total ratings count
    const [[stats]] = await db.query(
      'SELECT COALESCE(ROUND(AVG(value), 1), 0) AS avgRating, COUNT(*) AS totalRatings FROM ratings WHERE store_id = ?',
      [numStoreId]
    );

    res.json({
      success: true,
      message: 'Rating saved successfully.',
      value: ratingValue,
      storeOverallRating: Number(stats.avgRating),
      totalRatings: Number(stats.totalRatings),
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Internal server error while submitting rating.' });
  }
});

module.exports = router;

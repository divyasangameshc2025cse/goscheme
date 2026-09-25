const express = require('express');
const { allAsync, runAsync } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await allAsync(
      `SELECT * FROM notifications WHERE user_id IS NULL OR user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );

    const notifications = rows.map(r => ({
      id: r.id,
      title: r.title,
      message: r.message,
      timestamp: r.timestamp,
      type: r.type,
      read: Boolean(r.is_read)
    }));

    return res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await runAsync(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id IS NULL OR user_id = ?)`,
      [req.params.id, req.user.id]
    );
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update notification status' });
  }
});

module.exports = router;

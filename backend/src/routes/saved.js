const express = require('express');
const { runAsync, allAsync, getAsync } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/saved-schemes - Get logged-in user's saved scheme IDs & scheme objects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await allAsync(
      `SELECT s.* FROM saved_schemes ss
       JOIN schemes s ON ss.scheme_id = s.id
       WHERE ss.user_id = ?`,
      [req.user.id]
    );

    const savedSchemes = rows.map(r => ({
      id: r.id,
      title: r.title,
      department: r.department,
      level: r.level,
      category: r.category,
      minAge: r.min_age,
      maxAge: r.max_age,
      gender: r.gender,
      incomeCap: r.income_cap,
      education: JSON.parse(r.education || '[]'),
      occupation: JSON.parse(r.occupation || '[]'),
      casteCategory: JSON.parse(r.caste_category || '[]'),
      districtEligibility: r.district_eligibility,
      benefits: r.benefits,
      applicationDeadline: r.application_deadline,
      officialUrl: r.official_url,
      description: r.description,
      documents: JSON.parse(r.documents || '[]'),
      isNew: Boolean(r.is_new),
      status: r.status
    }));

    const savedIds = savedSchemes.map(s => s.id);

    return res.json({
      success: true,
      savedIds,
      schemes: savedSchemes
    });
  } catch (err) {
    console.error('Error fetching saved schemes:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch saved schemes' });
  }
});

// POST /api/saved-schemes/toggle - Toggle bookmark status for scheme ID
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const { schemeId } = req.body;
    if (!schemeId) {
      return res.status(400).json({ success: false, message: 'schemeId is required' });
    }

    const existing = await getAsync(
      `SELECT id FROM saved_schemes WHERE user_id = ? AND scheme_id = ?`,
      [req.user.id, schemeId]
    );

    let isSaved = false;
    if (existing) {
      await runAsync(`DELETE FROM saved_schemes WHERE user_id = ? AND scheme_id = ?`, [req.user.id, schemeId]);
      isSaved = false;
    } else {
      await runAsync(`INSERT INTO saved_schemes (user_id, scheme_id) VALUES (?, ?)`, [req.user.id, schemeId]);
      isSaved = true;
    }

    const allSavedRows = await allAsync(`SELECT scheme_id FROM saved_schemes WHERE user_id = ?`, [req.user.id]);
    const savedIds = allSavedRows.map(r => r.scheme_id);

    return res.json({
      success: true,
      isSaved,
      savedIds,
      message: isSaved ? 'Scheme saved successfully' : 'Scheme removed from saved list'
    });
  } catch (err) {
    console.error('Error toggling saved scheme:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle saved scheme' });
  }
});

module.exports = router;

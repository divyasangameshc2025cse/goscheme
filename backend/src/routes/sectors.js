const express = require('express');
const { allAsync } = require('../db/database');
const { metaFor, slugToCategory } = require('../db/sectors');

const router = express.Router();

// Tiny in-memory cache: sector counts rarely change within a session and
// recomputing them on every navbar/landing-page load is wasted work.
let sectorCache = { data: null, ts: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function parseSchemeRow(row) {
  return {
    id: row.id,
    title: row.title,
    department: row.department,
    level: row.level,
    state: row.state,
    category: row.category,
    minAge: row.min_age,
    maxAge: row.max_age,
    gender: row.gender,
    incomeCap: row.income_cap,
    education: JSON.parse(row.education || '[]'),
    occupation: JSON.parse(row.occupation || '[]'),
    casteCategory: JSON.parse(row.caste_category || '[]'),
    districtEligibility: row.district_eligibility,
    benefits: row.benefits,
    applicationDeadline: row.application_deadline,
    officialUrl: row.official_url,
    description: row.description,
    documents: JSON.parse(row.documents || '[]'),
    isNew: Boolean(row.is_new),
    status: row.status
  };
}

// GET /api/sectors
// Returns ONLY sector names + counts (a few hundred bytes) so the Explore
// page can paint instantly, instead of shipping every scheme up front.
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (sectorCache.data && now - sectorCache.ts < CACHE_TTL_MS) {
      return res.json({ success: true, sectors: sectorCache.data, cached: true });
    }

    const rows = await allAsync(
      `SELECT category, COUNT(*) as count FROM schemes WHERE status = 'Active' GROUP BY category ORDER BY count DESC`
    );

    const sectors = rows.map(r => ({ ...metaFor(r.category), count: r.count }));
    sectorCache = { data: sectors, ts: now };

    return res.json({ success: true, sectors, cached: false });
  } catch (err) {
    console.error('Error fetching sectors:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch sectors' });
  }
});

// GET /api/sectors/:slug/schemes?page=1&limit=12&search=&level=
// Loads schemes for ONE sector only, paginated — the key to keeping the
// site fast even as the scraped dataset grows into the thousands.
router.get('/:slug/schemes', async (req, res) => {
  try {
    const category = slugToCategory(req.params.slug);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Unknown sector' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const { search, level, state } = req.query;

    let sql = `SELECT * FROM schemes WHERE status = 'Active' AND category = ?`;
    const params = [category];

    if (level && level !== 'All') {
      sql += ` AND level = ?`;
      params.push(level);
    }
    if (state && state !== 'All') {
      sql += ` AND state = ?`;
      params.push(state);
    }
    if (search) {
      sql += ` AND (title LIKE ? OR description LIKE ? OR department LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    const countRows = await allAsync(`SELECT COUNT(*) as total FROM (${sql})`, params);
    const total = countRows[0]?.total || 0;

    sql += ` ORDER BY is_new DESC, level DESC, id ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await allAsync(sql, params);
    const schemes = rows.map(parseSchemeRow);

    return res.json({
      success: true,
      sector: metaFor(category),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      schemes
    });
  } catch (err) {
    console.error('Error fetching sector schemes:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch sector schemes' });
  }
});

module.exports = router;

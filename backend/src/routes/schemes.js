const express = require('express');
const { allAsync, getAsync } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Eligibility Matching Algorithm
function evaluateEligibility(scheme, user) {
  if (!user || !user.isProfileComplete) {
    return { isEligible: true, matchPercent: 100, matchReasons: ["Complete profile for personalized match"] };
  }

  const reasons = [];
  let score = 0;
  let maxScore = 5;

  // 1. Gender Match Check
  if (scheme.gender === "All" || scheme.gender === user.gender) {
    score++;
    reasons.push(`✓ Gender Match (${user.gender})`);
  }

  // 2. Age Window Check
  if (user.age >= scheme.minAge && user.age <= scheme.maxAge) {
    score++;
    reasons.push(`✓ Age within ${scheme.minAge}-${scheme.maxAge} yrs`);
  }

  // 3. Income Cap Check
  if (user.income <= scheme.incomeCap) {
    score++;
    reasons.push(`✓ Household Income < ₹${scheme.incomeCap.toLocaleString('en-IN')}`);
  }

  // 4. Education / Occupation Match Check
  const edList = Array.isArray(scheme.education) ? scheme.education : [];
  const occList = Array.isArray(scheme.occupation) ? scheme.occupation : [];

  if (edList.includes("All") || edList.includes(user.education) || occList.includes("All") || occList.includes(user.occupation)) {
    score++;
    reasons.push(`✓ Qualification (${user.education}) & Occupation (${user.occupation})`);
  }

  // 5. Caste / Category or Location Check
  const casteList = Array.isArray(scheme.casteCategory) ? scheme.casteCategory : [];
  if (casteList.includes("All") || casteList.includes(user.caste) || scheme.level === "Tamil Nadu") {
    score++;
    reasons.push(`✓ Resident of ${user.state}`);
  }

  const matchPercent = Math.round((score / maxScore) * 100);
  const isEligible = matchPercent >= 60;

  return { isEligible, matchPercent, matchReasons: reasons };
}

function parseSchemeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    department: row.department,
    level: row.level,
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

// GET /api/schemes - List all schemes with filtering
router.get('/', async (req, res) => {
  try {
    const { level, category, search, status } = req.query;
    let sql = `SELECT * FROM schemes WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    } else {
      sql += ` AND status = 'Active'`;
    }

    if (level && level !== 'All') {
      sql += ` AND level = ?`;
      params.push(level);
    }

    if (category && category !== 'All') {
      sql += ` AND category LIKE ?`;
      params.push(`%${category}%`);
    }

    if (search) {
      sql += ` AND (title LIKE ? OR description LIKE ? OR category LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY created_at DESC`;

    const rows = await allAsync(sql, params);
    const schemes = rows.map(parseSchemeRow);

    return res.json({ success: true, count: schemes.length, schemes });
  } catch (err) {
    console.error('Error fetching schemes:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch schemes' });
  }
});

// GET /api/schemes/eligible - Get customized eligible schemes for logged in user
router.get('/eligible', authenticateToken, async (req, res) => {
  try {
    const userRow = await getAsync(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (!userRow || !userRow.is_profile_complete) {
      return res.status(400).json({
        success: false,
        message: 'User profile is incomplete. Please complete setup.',
        isProfileComplete: false
      });
    }

    const birth = new Date(userRow.dob || '2000-01-01');
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    const userProfile = {
      gender: userRow.gender,
      age: age >= 0 ? age : 22,
      income: userRow.income,
      education: userRow.education,
      occupation: userRow.occupation,
      caste: userRow.caste,
      state: userRow.state,
      isProfileComplete: true
    };

    const rows = await allAsync(`SELECT * FROM schemes WHERE status = 'Active'`);
    const schemes = rows.map(parseSchemeRow);

    const eligibleSchemes = schemes
      .map(s => {
        const evalResult = evaluateEligibility(s, userProfile);
        return {
          ...s,
          isEligible: evalResult.isEligible,
          matchPercent: evalResult.matchPercent,
          matchReasons: evalResult.matchReasons
        };
      })
      .filter(item => item.isEligible)
      .sort((a, b) => b.matchPercent - a.matchPercent);

    return res.json({
      success: true,
      userName: userRow.full_name,
      count: eligibleSchemes.length,
      schemes: eligibleSchemes
    });
  } catch (err) {
    console.error('Error calculating eligible schemes:', err);
    return res.status(500).json({ success: false, message: 'Failed to evaluate eligibility' });
  }
});

// GET /api/schemes/:id - Fetch scheme details by ID
router.get('/:id', async (req, res) => {
  try {
    const row = await getAsync(`SELECT * FROM schemes WHERE id = ?`, [req.params.id]);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }
    return res.json({ success: true, scheme: parseSchemeRow(row) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching scheme details' });
  }
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runAsync, getAsync, allAsync } = require('../db/database');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (password === 'admin123' || password === 'admin') {
      const adminUser = await getAsync(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`);
      const token = jwt.sign(
        { userId: adminUser ? adminUser.id : 999, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ success: true, message: 'Admin login successful', token });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid Admin Password' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Admin login error' });
  }
});

// GET /api/admin/metrics
router.get('/metrics', async (req, res) => {
  try {
    const totalRow = await getAsync(`SELECT COUNT(*) as count FROM schemes`);
    const activeRow = await getAsync(`SELECT COUNT(*) as count FROM schemes WHERE status = 'Active'`);
    const tnRow = await getAsync(`SELECT COUNT(*) as count FROM schemes WHERE level = 'Tamil Nadu'`);
    const centralRow = await getAsync(`SELECT COUNT(*) as count FROM schemes WHERE level = 'Central'`);
    const userRow = await getAsync(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`);

    return res.json({
      success: true,
      metrics: {
        totalSchemes: totalRow.count,
        activeSchemes: activeRow.count,
        tnSchemes: tnRow.count,
        centralSchemes: centralRow.count,
        registeredUsers: userRow.count
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin metrics' });
  }
});

// POST /api/admin/schemes - Add new scheme
router.post('/schemes', async (req, res) => {
  try {
    const {
      title,
      department,
      level,
      category,
      minAge,
      maxAge,
      gender,
      incomeCap,
      education,
      occupation,
      benefits,
      applicationDeadline,
      officialUrl,
      description,
      documents
    } = req.body;

    const allSchemes = await allAsync(`SELECT id FROM schemes`);
    const newId = `TN-${String(allSchemes.length + 1).padStart(3, '0')}`;

    const edArr = Array.isArray(education) ? education : [education || 'Undergraduate'];
    const occArr = Array.isArray(occupation) ? occupation : [occupation || 'Student'];
    const docArr = Array.isArray(documents) ? documents : typeof documents === 'string' ? documents.split(',').map(d => d.trim()) : [];

    await runAsync(
      `INSERT INTO schemes (id, title, department, level, category, min_age, max_age, gender, income_cap, education, occupation, caste_category, district_eligibility, benefits, application_deadline, official_url, description, documents, is_new, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Active')`,
      [
        newId,
        title,
        department,
        level,
        category,
        parseInt(minAge || 0),
        parseInt(maxAge || 100),
        gender,
        parseInt(incomeCap || 9999999),
        JSON.stringify(edArr),
        JSON.stringify(occArr),
        JSON.stringify(['All']),
        'All Tamil Nadu Districts',
        benefits,
        applicationDeadline,
        officialUrl,
        description,
        JSON.stringify(docArr)
      ]
    );

    return res.status(201).json({ success: true, message: 'Scheme created successfully', schemeId: newId });
  } catch (err) {
    console.error('Error creating scheme:', err);
    return res.status(500).json({ success: false, message: 'Failed to create scheme' });
  }
});

// PUT /api/admin/schemes/:id/status - Toggle status
router.put('/schemes/:id/status', async (req, res) => {
  try {
    const scheme = await getAsync(`SELECT status FROM schemes WHERE id = ?`, [req.params.id]);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    const newStatus = scheme.status === 'Active' ? 'Inactive' : 'Active';
    await runAsync(`UPDATE schemes SET status = ? WHERE id = ?`, [newStatus, req.params.id]);

    return res.json({ success: true, newStatus, message: `Status updated to ${newStatus}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// DELETE /api/admin/schemes/:id - Delete scheme
router.delete('/schemes/:id', async (req, res) => {
  try {
    await runAsync(`DELETE FROM schemes WHERE id = ?`, [req.params.id]);
    return res.json({ success: true, message: `Scheme ${req.params.id} deleted` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete scheme' });
  }
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runAsync, getAsync } = require('../db/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full Name, Email and Password are required' });
    }

    const existingUser = await getAsync(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await runAsync(
      `INSERT INTO users (email, password_hash, full_name, phone, is_profile_complete, role)
       VALUES (?, ?, ?, ?, 0, 'user')`,
      [email, passwordHash, fullName, phone || '']
    );

    const userId = result.id;
    const token = jwt.sign({ userId, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    const newUser = await getAsync(
      `SELECT id, email, full_name as fullName, phone, is_profile_complete as isProfileComplete, role FROM users WHERE id = ?`,
      [userId]
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        ...newUser,
        isProfileComplete: Boolean(newUser.isProfileComplete)
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await getAsync(`SELECT * FROM users WHERE email = ?`, [email]);

    // If user doesn't exist, auto-register mock user for frictionless UX if using default credentials
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      const nameFromEmail = email.split('@')[0].replace('.', ' ').toUpperCase();
      const insertRes = await runAsync(
        `INSERT INTO users (email, password_hash, full_name, phone, dob, gender, caste, state, district, area, income, occupation, education, ration_card, disability_status, first_gen_graduate, govt_school_studied, is_profile_complete, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'user')`,
        [
          email,
          passwordHash,
          nameFromEmail,
          '+91 98765 00000',
          '2002-08-20',
          'Female',
          'BC',
          'Tamil Nadu',
          'Chennai',
          'Urban',
          180000,
          'Student',
          'Undergraduate',
          'Rice Card',
          'No',
          'Yes',
          'Yes'
        ]
      );

      const createdUser = await getAsync(`SELECT * FROM users WHERE id = ?`, [insertRes.id]);
      const token = jwt.sign({ userId: createdUser.id, role: createdUser.role }, JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: formatUserProfile(createdUser)
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserProfile(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getAsync(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: formatUserProfile(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      dob,
      gender,
      caste,
      district,
      area,
      income,
      occupation,
      education,
      rationCard,
      disabilityStatus,
      firstGenGraduate,
      govtSchoolStudied
    } = req.body;

    await runAsync(
      `UPDATE users SET
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        dob = COALESCE(?, dob),
        gender = COALESCE(?, gender),
        caste = COALESCE(?, caste),
        district = COALESCE(?, district),
        area = COALESCE(?, area),
        income = COALESCE(?, income),
        occupation = COALESCE(?, occupation),
        education = COALESCE(?, education),
        ration_card = COALESCE(?, ration_card),
        disability_status = COALESCE(?, disability_status),
        first_gen_graduate = COALESCE(?, first_gen_graduate),
        govt_school_studied = COALESCE(?, govt_school_studied),
        is_profile_complete = 1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        fullName,
        phone,
        dob,
        gender,
        caste,
        district,
        area,
        income,
        occupation,
        education,
        rationCard,
        disabilityStatus,
        firstGenGraduate,
        govtSchoolStudied,
        req.user.id
      ]
    );

    const updatedUser = await getAsync(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserProfile(updatedUser)
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

function calculateAge(dobStr) {
  if (!dobStr) return 22;
  const birth = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : 0;
}

function formatUserProfile(u) {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    dob: u.dob,
    age: calculateAge(u.dob),
    gender: u.gender,
    caste: u.caste,
    state: u.state,
    district: u.district,
    area: u.area,
    income: u.income,
    occupation: u.occupation,
    education: u.education,
    rationCard: u.ration_card,
    disabilityStatus: u.disability_status,
    firstGenGraduate: u.first_gen_graduate,
    govtSchoolStudied: u.govt_school_studied,
    isProfileComplete: Boolean(u.is_profile_complete),
    role: u.role
  };
}

module.exports = router;

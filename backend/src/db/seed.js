const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { initDatabaseSchema, runAsync, getAsync } = require('./database');
const { parseCSVDataset } = require('./parse_csv');

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Pudhumai Penn Phase 3 Registration Open",
    message: "New application window for girl students in undergraduate 1st year is now open till Dec 15.",
    timestamp: "2 hours ago",
    type: "new_scheme",
    is_read: 0
  },
  {
    id: "notif-2",
    title: "Upcoming Deadline Alert!",
    message: "TN Post-Matric Scholarship deadline is in 14 days (Oct 15). Complete your application soon.",
    timestamp: "1 day ago",
    type: "deadline",
    is_read: 0
  },
  {
    id: "notif-3",
    title: "Profile Eligibility Refresh Complete",
    message: "Based on your updated profile details, you are eligible for 12 Government Schemes!",
    timestamp: "3 days ago",
    type: "system",
    is_read: 1
  }
];

async function seedDatabase() {
  await initDatabaseSchema();
  
  let schemes = [];
  const jsonPath = path.join(__dirname, 'schemes_dataset.json');
  if (fs.existsSync(jsonPath)) {
    schemes = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } else {
    schemes = parseCSVDataset();
  }

  console.log(`Seeding database with ${schemes.length} government schemes from CSV dataset...`);

  // 1. Seed Schemes
  for (const s of schemes) {
    const edJson = JSON.stringify(Array.isArray(s.education) ? s.education : [s.education]);
    const occJson = JSON.stringify(Array.isArray(s.occupation) ? s.occupation : [s.occupation]);
    const casteJson = JSON.stringify(Array.isArray(s.casteCategory) ? s.casteCategory : [s.casteCategory]);
    const docJson = JSON.stringify(Array.isArray(s.documents) ? s.documents : [s.documents]);

    const existing = await getAsync(`SELECT id FROM schemes WHERE id = ?`, [s.id]);
    if (!existing) {
      await runAsync(
        `INSERT INTO schemes (id, title, department, level, category, min_age, max_age, gender, income_cap, education, occupation, caste_category, district_eligibility, benefits, application_deadline, official_url, description, documents, is_new, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.title, s.department, s.level, s.category, s.minAge, s.maxAge, s.gender, s.incomeCap, edJson, occJson, casteJson, s.districtEligibility, s.benefits, s.applicationDeadline, s.officialUrl, s.description, docJson, s.isNew ? 1 : 0, s.status || 'Active']
      );
    } else {
      await runAsync(
        `UPDATE schemes SET
          title = ?, department = ?, level = ?, category = ?, min_age = ?, max_age = ?, gender = ?, income_cap = ?, education = ?, occupation = ?, caste_category = ?, district_eligibility = ?, benefits = ?, application_deadline = ?, official_url = ?, description = ?, documents = ?, is_new = ?, status = ?
         WHERE id = ?`,
        [s.title, s.department, s.level, s.category, s.minAge, s.maxAge, s.gender, s.incomeCap, edJson, occJson, casteJson, s.districtEligibility, s.benefits, s.applicationDeadline, s.officialUrl, s.description, docJson, s.isNew ? 1 : 0, s.status || 'Active', s.id]
      );
    }
  }

  // 2. Seed Default Citizen User
  const defaultUserEmail = 'ananya.sundaram@example.com';
  const userExists = await getAsync(`SELECT id FROM users WHERE email = ?`, [defaultUserEmail]);
  let userId = null;
  if (!userExists) {
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const res = await runAsync(
      `INSERT INTO users (email, password_hash, full_name, phone, dob, gender, caste, state, district, area, income, occupation, education, ration_card, disability_status, first_gen_graduate, govt_school_studied, is_profile_complete, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        defaultUserEmail,
        defaultPasswordHash,
        'Ananya Sundaram',
        '+91 98765 43210',
        '2004-05-14',
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
        'Yes',
        1,
        'user'
      ]
    );
    userId = res.id;
  } else {
    userId = userExists.id;
  }

  // 3. Seed Default Admin User
  const adminEmail = 'admin@goscheme.gov.in';
  const adminExists = await getAsync(`SELECT id FROM users WHERE email = ?`, [adminEmail]);
  if (!adminExists) {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await runAsync(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES (?, ?, ?, ?, ?)`,
      [adminEmail, adminPasswordHash, 'GoScheme Administrator', '+91 90000 00000', 'admin']
    );
  }

  // 4. Seed Saved Schemes for Default User
  if (userId) {
    const defaultSaved = ["CENT-001", "CENT-002", "CENT-005"];
    for (const schemeId of defaultSaved) {
      const savedExist = await getAsync(`SELECT id FROM saved_schemes WHERE user_id = ? AND scheme_id = ?`, [userId, schemeId]);
      if (!savedExist) {
        await runAsync(`INSERT INTO saved_schemes (user_id, scheme_id) VALUES (?, ?)`, [userId, schemeId]);
      }
    }
  }

  // 5. Seed Notifications
  for (const n of INITIAL_NOTIFICATIONS) {
    const notifExist = await getAsync(`SELECT id FROM notifications WHERE id = ?`, [n.id]);
    if (!notifExist) {
      await runAsync(
        `INSERT INTO notifications (id, user_id, title, message, timestamp, type, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [n.id, userId, n.title, n.message, n.timestamp, n.type, n.is_read]
      );
    }
  }

  console.log(`Database seeding completed successfully with ${schemes.length} government schemes from CSV dataset.`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Database seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

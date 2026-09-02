const bcrypt = require('bcryptjs');
const { initDatabaseSchema, runAsync, getAsync } = require('./database');

const INITIAL_SCHEMES = [
  {
    id: "TN-001",
    title: "Pudhumai Penn Scheme (Moovalur Ramamirtham Ammiyar Higher Education Assurance)",
    department: "Department of Social Welfare & Women Empowerment, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Women & Education",
    minAge: 17,
    maxAge: 25,
    gender: "Female",
    incomeCap: 250000,
    education: JSON.stringify(["Undergraduate", "Diploma", "ITI"]),
    occupation: JSON.stringify(["Student"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "₹1,000 per month financial assistance directly deposited to bank accounts until completion of degree/diploma.",
    applicationDeadline: "2026-12-15",
    officialUrl: "https://www.penkalvi.tn.gov.in",
    description: "Supports girl students who studied in Government schools from Class 6 to 12 in pursuing higher education by providing monthly financial aid.",
    documents: JSON.stringify(["Aadhaar Card", "Class 6-12 Govt School Study Certificate", "Bank Passbook Copy", "College Bonafide Certificate"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "TN-002",
    title: "Naan Mudhalvan Skill Development Program",
    department: "Tamil Nadu Skill Development Corporation (TNSDC)",
    level: "Tamil Nadu",
    category: "Education & Employment",
    minAge: 18,
    maxAge: 30,
    gender: "All",
    incomeCap: 500000,
    education: JSON.stringify(["Undergraduate", "Postgraduate", "Diploma"]),
    occupation: JSON.stringify(["Student", "Unemployed"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Free industry-aligned tech courses, certifications, language training, and direct campus placement support.",
    applicationDeadline: "2026-10-31",
    officialUrl: "https://www.naanmudhalvan.tn.gov.in",
    description: "Flagship skill enhancement initiative aimed at empowering 10 Lakh youth in Tamil Nadu with modern industry skills annually.",
    documents: JSON.stringify(["Aadhaar Card", "Degree/Diploma Marksheets", "College ID Card"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "TN-003",
    title: "Kalaignar Magalir Urimai Thittam",
    department: "Special Programme Implementation Dept, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Women & Financial Aid",
    minAge: 21,
    maxAge: 60,
    gender: "Female",
    incomeCap: 250000,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["Self-Employed", "Homemaker", "Unemployed"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Monthly basic income rights of ₹1,000 transferred to women heads of eligible households.",
    applicationDeadline: "2026-11-20",
    officialUrl: "https://kmut.tn.gov.in",
    description: "Rights-based monthly financial grant empowering women heads of families across rural and urban Tamil Nadu.",
    documents: JSON.stringify(["Smart Family Card (Ration Card)", "Aadhaar Card", "Bank Passbook linked with Aadhaar", "Electricity Bill"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "TN-004",
    title: "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
    department: "Health and Family Welfare Dept, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Healthcare",
    minAge: 0,
    maxAge: 100,
    gender: "All",
    incomeCap: 120000,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["All"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Cashless medical insurance coverage up to ₹5 Lakhs per family per year in empanelled public and private hospitals.",
    applicationDeadline: "2026-12-31",
    officialUrl: "https://www.cmchistn.com",
    description: "Provides free health insurance coverage for low-income families in Tamil Nadu for over 1,500 medical and surgical procedures.",
    documents: JSON.stringify(["Income Certificate", "Ration Card", "Aadhaar Card of Family Members"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "TN-005",
    title: "TN Post-Matric Scholarship for SC / ST / SCC Students",
    department: "Adi Dravidar and Tribal Welfare Dept, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Scholarship",
    minAge: 15,
    maxAge: 35,
    gender: "All",
    incomeCap: 250000,
    education: JSON.stringify(["Undergraduate", "Postgraduate", "Diploma", "Ph.D"]),
    occupation: JSON.stringify(["Student"]),
    casteCategory: JSON.stringify(["SC", "ST", "SCC"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Full tuition fee waiver, maintenance allowance, and compulsory non-refundable fees reimbursement.",
    applicationDeadline: "2026-10-15",
    officialUrl: "https://escholarship.tn.gov.in",
    description: "100% financial tuition support for Scheduled Caste and Scheduled Tribe students pursuing higher education.",
    documents: JSON.stringify(["Community Certificate", "Income Certificate", "Bonafide Certificate", "Aadhaar Card"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "TN-006",
    title: "TN Chief Minister's Breakfast Scheme for Primary School Students",
    department: "Social Welfare Dept, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Education & Child Welfare",
    minAge: 5,
    maxAge: 11,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["Primary School"]),
    occupation: JSON.stringify(["Student"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Free nutritious hot cooked morning meal on all school working days.",
    applicationDeadline: "2027-03-31",
    officialUrl: "https://www.tn.gov.in",
    description: "Pioneering state scheme providing wholesome breakfast to government primary school children across Tamil Nadu.",
    documents: JSON.stringify(["School Student Enrollment ID", "Ration Card"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "CENT-001",
    title: "PM-KISAN Samman Nidhi (Pradhan Mantri Kisan Samman Nidhi)",
    department: "Ministry of Agriculture & Farmers Welfare, Govt of India",
    level: "Central",
    category: "Agriculture",
    minAge: 18,
    maxAge: 75,
    gender: "All",
    incomeCap: 400000,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["Farmer"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "₹6,000 annually paid in 3 equal installments of ₹2,000 directly into farmer bank accounts.",
    applicationDeadline: "2026-11-15",
    officialUrl: "https://pmkisan.gov.in",
    description: "Income support scheme for all landholding farmer families across India to meet agricultural and domestic needs.",
    documents: JSON.stringify(["Land Ownership Documents (Chitta/Adangal)", "Aadhaar Card", "Bank Account Details"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "CENT-002",
    title: "Pradhan Mantri MUDRA Yojana (PMMY) - Shishu & Kishor Loans",
    department: "Ministry of Finance, Govt of India",
    level: "Central",
    category: "Entrepreneurship & Loan",
    minAge: 18,
    maxAge: 65,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["Self-Employed", "Business Owner", "Unemployed"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Collateral-free business loans up to ₹50,000 (Shishu) and up to ₹5 Lakhs (Kishor) at low interest rates.",
    applicationDeadline: "2027-01-31",
    officialUrl: "https://www.mudra.org.in",
    description: "Provides financial credit for small/micro enterprise development without requiring collateral security.",
    documents: JSON.stringify(["Business Plan Summary", "Identity & Address Proof", "Bank Statement (Last 6 Months)"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "CENT-003",
    title: "PM Awas Yojana (Urban) - Credit Linked Subsidy Scheme",
    department: "Ministry of Housing and Urban Affairs, Govt of India",
    level: "Central",
    category: "Housing",
    minAge: 21,
    maxAge: 70,
    gender: "All",
    incomeCap: 600000,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["All"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Urban Tamil Nadu",
    benefits: "Interest subsidy up to ₹2.67 Lakhs on home loans for first-time home buyers.",
    applicationDeadline: "2026-12-31",
    officialUrl: "https://pmaymis.gov.in",
    description: "Housing for All initiative providing interest subsidy to Economically Weaker Sections (EWS) and Low Income Groups (LIG).",
    documents: JSON.stringify(["Income Certificate", "Aadhaar Card", "Property Documents", "Declaration of No Pucca House"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "CENT-004",
    title: "National Overseas Scholarship for SC / ST / Artisan Students",
    department: "Ministry of Social Justice & Empowerment, Govt of India",
    level: "Central",
    category: "Scholarship & Overseas Education",
    minAge: 20,
    maxAge: 35,
    gender: "All",
    incomeCap: 800000,
    education: JSON.stringify(["Undergraduate", "Postgraduate"]),
    occupation: JSON.stringify(["Student"]),
    casteCategory: JSON.stringify(["SC", "ST", "BC"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Full tuition fee payment, maintenance allowance of $15,400/year, contingency allowance, and airfare for Master's/Ph.D abroad.",
    applicationDeadline: "2026-10-30",
    officialUrl: "https://nosmsje.gov.in",
    description: "Supports low-income students from marginalized communities to pursue Master's or Ph.D degrees in reputed foreign universities.",
    documents: JSON.stringify(["Offer Letter from Foreign University", "Caste Certificate", "Income Certificate", "Passport Copy"]),
    isNew: 1,
    status: "Active"
  }
];

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
    message: "Based on your updated profile details, you are eligible for 6 Government Schemes!",
    timestamp: "3 days ago",
    type: "system",
    is_read: 1
  }
];

async function seedDatabase() {
  await initDatabaseSchema();
  console.log('Seeding initial data...');

  // 1. Seed Schemes
  for (const s of INITIAL_SCHEMES) {
    const existing = await getAsync(`SELECT id FROM schemes WHERE id = ?`, [s.id]);
    if (!existing) {
      await runAsync(
        `INSERT INTO schemes (id, title, department, level, category, min_age, max_age, gender, income_cap, education, occupation, caste_category, district_eligibility, benefits, application_deadline, official_url, description, documents, is_new, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.title, s.department, s.level, s.category, s.minAge, s.maxAge, s.gender, s.incomeCap, s.education, s.occupation, s.casteCategory, s.districtEligibility, s.benefits, s.applicationDeadline, s.officialUrl, s.description, s.documents, s.isNew, s.status]
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
    const defaultSaved = ["TN-001", "TN-002"];
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

  console.log('Database seeding completed successfully.');
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

const bcrypt = require('bcryptjs');
const { initDatabaseSchema, runAsync, getAsync } = require('./database');

const INITIAL_SCHEMES = [
  // TAMIL NADU STATE SCHEMES (TN)
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
    title: "Naan Mudhalvan Skill Development & Career Guidance Program",
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
    benefits: "Free industry-aligned tech courses, certifications, coding bootcamps, and direct campus placement support.",
    applicationDeadline: "2026-10-31",
    officialUrl: "https://www.naanmudhalvan.tn.gov.in",
    description: "Flagship skill enhancement initiative aimed at empowering 10 Lakh youth in Tamil Nadu with modern industry skills annually.",
    documents: JSON.stringify(["Aadhaar Card", "Degree/Diploma Marksheets", "College ID Card"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "TN-003",
    title: "Kalaignar Magalir Urimai Thittam (KMUT)",
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
    benefits: "Monthly basic income rights of ₹1,000 transferred directly to women heads of eligible households.",
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
    title: "Chief Minister's Fellowship Programme (CMFP)",
    department: "Special Programme Implementation Dept, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Governance & Research",
    minAge: 22,
    maxAge: 30,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["Postgraduate", "Undergraduate"]),
    occupation: JSON.stringify(["Student", "Unemployed", "Self-Employed"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Monthly fellowship stipend of ₹65,000 + ₹10,000 travel allowance for working on flagship state development projects.",
    applicationDeadline: "2026-11-30",
    officialUrl: "https://cmfp.tn.gov.in",
    description: "2-year prestigious fellowship program engaging young talented professionals in policy implementation across Tamil Nadu.",
    documents: JSON.stringify(["Degree Certificate", "Curriculum Vitae", "Statement of Purpose", "Identity Proof"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "TN-007",
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
    id: "TN-008",
    title: "Annal Ambedkar Business Champions Scheme (AABCS)",
    department: "Micro, Small and Medium Enterprises (MSME) Dept, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Entrepreneurship & Loan",
    minAge: 18,
    maxAge: 55,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["Self-Employed", "Business Owner", "Unemployed"]),
    casteCategory: JSON.stringify(["SC", "ST"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "35% capital subsidy up to ₹1.5 Crore and 6% interest subvention for first-generation SC/ST entrepreneurs.",
    applicationDeadline: "2026-12-31",
    officialUrl: "https://msme.tn.gov.in",
    description: "Promotes economic empowerment of SC/ST entrepreneurs by facilitating financial assistance and credit for new business ventures.",
    documents: JSON.stringify(["Community Certificate", "Project Proposal Summary", "GST Registration", "Aadhaar Card"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "TN-009",
    title: "Tamil Nadu Chief Minister's Rural Development Fellowship Scheme",
    department: "Rural Development & Panchayat Raj Dept, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Rural Development",
    minAge: 21,
    maxAge: 32,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["Undergraduate", "Postgraduate"]),
    occupation: JSON.stringify(["Student", "Unemployed"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Monthly fellowship of ₹45,000 to work directly with Village Panchayats for rural digital transformation.",
    applicationDeadline: "2026-10-25",
    officialUrl: "https://tnrd.tn.gov.in",
    description: "Engages youth in rural development governance, scheme monitoring, and grassroots economic strengthening.",
    documents: JSON.stringify(["Degree Certificate", "Aadhaar Card", "College Marksheet"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "TN-010",
    title: "Moovalur Ramamirtham Ammiyar Marriage Assistance Scheme",
    department: "Social Welfare & Women Empowerment, Tamil Nadu",
    level: "Tamil Nadu",
    category: "Marriage Assistance & Social Security",
    minAge: 18,
    maxAge: 30,
    gender: "Female",
    incomeCap: 72000,
    education: JSON.stringify(["Diploma", "Undergraduate"]),
    occupation: JSON.stringify(["Unemployed", "Homemaker", "Self-Employed"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Financial grant of ₹50,000 + 8 Grams 22 Karat Gold Coin for marriage expenses of educated poor brides.",
    applicationDeadline: "2026-12-20",
    officialUrl: "https://www.tn.gov.in/scheme/data_view/2026",
    description: "Financial and gold assistance to encourage higher education among poor girls before marriage.",
    documents: JSON.stringify(["Degree/Diploma Certificate", "Income Certificate", "Invitation Card", "Ration Card"]),
    isNew: 0,
    status: "Active"
  },

  // CENTRAL GOVERNMENT SCHEMES (CENTRAL / INDIA)
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
    title: "PM Awas Yojana (Urban / Gramin) - Credit Linked Subsidy Scheme",
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
    title: "National Overseas Scholarship for SC / ST / BC Students",
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
  },
  {
    id: "CENT-005",
    title: "PM Surya Ghar: Muft Bijli Yojana (Rooftop Solar Subsidy)",
    department: "Ministry of New and Renewable Energy, Govt of India",
    level: "Central",
    category: "Solar & Energy",
    minAge: 18,
    maxAge: 80,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["All"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Direct government financial subsidy up to ₹78,000 for installing rooftop solar + 300 units of free electricity every month.",
    applicationDeadline: "2026-12-31",
    officialUrl: "https://pmsuryaghar.gov.in",
    description: "Provides clean solar power to 1 Crore households across India while drastically reducing monthly electricity bills.",
    documents: JSON.stringify(["Electricity Bill Copy", "Aadhaar Card", "Rooftop Property Document", "Bank Passbook"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "CENT-006",
    title: "PM Vishwakarma Scheme for Artisans and Traditional Craftsmen",
    department: "Ministry of Micro, Small and Medium Enterprises, Govt of India",
    level: "Central",
    category: "Artisans & Skill Development",
    minAge: 18,
    maxAge: 65,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["Self-Employed", "Business Owner", "Unemployed"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Skill training stipend of ₹500/day, ₹15,000 digital toolkit e-voucher, and collateral-free loan up to ₹3 Lakhs at 5% interest rate.",
    applicationDeadline: "2027-02-28",
    officialUrl: "https://pmvishwakarma.gov.in",
    description: "End-to-end support for traditional artisans including carpenters, weavers, blacksmiths, barbers, tailors, and cobblers.",
    documents: JSON.stringify(["Aadhaar Card", "Bank Account Details", "Traditional Craft Certificate / Verification"]),
    isNew: 1,
    status: "Active"
  },
  {
    id: "CENT-007",
    title: "National Apprenticeship Promotion Scheme (NAPS)",
    department: "Ministry of Skill Development and Entrepreneurship, Govt of India",
    level: "Central",
    category: "Skill Training & Internship",
    minAge: 18,
    maxAge: 28,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["ITI", "Diploma", "Undergraduate"]),
    occupation: JSON.stringify(["Student", "Unemployed"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Direct stipend subsidy of up to ₹1,500/month per apprentice plus certified practical industrial training.",
    applicationDeadline: "2026-11-30",
    officialUrl: "https://www.apprenticeshipindia.gov.in",
    description: "Promotes apprenticeship training in top industries for ITI, diploma, and degree holders to gain practical experience.",
    documents: JSON.stringify(["Aadhaar Card", "Marksheets", "Bank Account Details"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "CENT-008",
    title: "Central Sector Scheme of Scholarship for College and University Students (NSP)",
    department: "Department of Higher Education, Ministry of Education, Govt of India",
    level: "Central",
    category: "Scholarship",
    minAge: 18,
    maxAge: 25,
    gender: "All",
    incomeCap: 450000,
    education: JSON.stringify(["Undergraduate", "Postgraduate"]),
    occupation: JSON.stringify(["Student"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "₹12,000 per annum at Graduation level for first 3 years and ₹20,000 per annum at Post-Graduation level.",
    applicationDeadline: "2026-10-31",
    officialUrl: "https://scholarships.gov.in",
    description: "Financial assistance to meritorious students from low-income families to meet day-to-day expenses while pursuing higher studies.",
    documents: JSON.stringify(["Class 12 Marksheet", "Income Certificate", "Bonafide Student Certificate", "Aadhaar Card"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "CENT-009",
    title: "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
    department: "Department of Financial Services, Govt of India",
    level: "Central",
    category: "Banking & Financial Inclusion",
    minAge: 10,
    maxAge: 75,
    gender: "All",
    incomeCap: 9999999,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["All"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Zero balance savings account, free RuPay debit card, ₹2 Lakh accidental insurance, and ₹10,000 overdraft facility.",
    applicationDeadline: "2027-03-31",
    officialUrl: "https://pmjdy.gov.in",
    description: "National mission for financial inclusion ensuring universal access to banking facilities and insurance for all households.",
    documents: JSON.stringify(["Aadhaar Card", "Passport Size Photograph"]),
    isNew: 0,
    status: "Active"
  },
  {
    id: "CENT-010",
    title: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
    department: "National Health Authority (NHA), Govt of India",
    level: "Central",
    category: "Healthcare",
    minAge: 0,
    maxAge: 100,
    gender: "All",
    incomeCap: 180000,
    education: JSON.stringify(["All"]),
    occupation: JSON.stringify(["All"]),
    casteCategory: JSON.stringify(["All"]),
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Cashless health insurance coverage of ₹5 Lakhs per family per year for secondary and tertiary care hospitalization.",
    applicationDeadline: "2027-03-31",
    officialUrl: "https://pmjay.gov.in",
    description: "World's largest government-funded health insurance scheme covering over 12 Crore poor and vulnerable families.",
    documents: JSON.stringify(["Aadhaar Card", "Ration Card / PM-JAY Family Letter"]),
    isNew: 0,
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
  console.log('Seeding initial dataset with 20 Tamil Nadu and Central schemes...');

  // 1. Seed Schemes
  for (const s of INITIAL_SCHEMES) {
    const existing = await getAsync(`SELECT id FROM schemes WHERE id = ?`, [s.id]);
    if (!existing) {
      await runAsync(
        `INSERT INTO schemes (id, title, department, level, category, min_age, max_age, gender, income_cap, education, occupation, caste_category, district_eligibility, benefits, application_deadline, official_url, description, documents, is_new, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.title, s.department, s.level, s.category, s.minAge, s.maxAge, s.gender, s.incomeCap, s.education, s.occupation, s.casteCategory, s.districtEligibility, s.benefits, s.applicationDeadline, s.officialUrl, s.description, s.documents, s.isNew, s.status]
      );
    } else {
      // Update existing record with updated fields & working official links
      await runAsync(
        `UPDATE schemes SET
          title = ?, department = ?, level = ?, category = ?, min_age = ?, max_age = ?, gender = ?, income_cap = ?, education = ?, occupation = ?, caste_category = ?, district_eligibility = ?, benefits = ?, application_deadline = ?, official_url = ?, description = ?, documents = ?, is_new = ?, status = ?
         WHERE id = ?`,
        [s.title, s.department, s.level, s.category, s.minAge, s.maxAge, s.gender, s.incomeCap, s.education, s.occupation, s.casteCategory, s.districtEligibility, s.benefits, s.applicationDeadline, s.officialUrl, s.description, s.documents, s.isNew, s.status, s.id]
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
    const defaultSaved = ["TN-001", "TN-002", "CENT-005"];
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

  console.log('Database seeding completed successfully with 20 government schemes.');
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

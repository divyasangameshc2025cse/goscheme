/* ==========================================================================
   GO SCHEME - Mock Dataset & LocalStorage Initializer
   ========================================================================== */

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
    education: ["Undergraduate", "Diploma", "ITI"],
    occupation: ["Student"],
    casteCategory: ["All"],
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "₹1,000 per month financial assistance directly deposited to bank accounts until completion of degree/diploma.",
    applicationDeadline: "2026-12-15",
    officialUrl: "https://www.penkalvi.tn.gov.in",
    description: "Supports girl students who studied in Government schools from Class 6 to 12 in pursuing higher education by providing monthly financial aid.",
    documents: ["Aadhaar Card", "Class 6-12 Govt School Study Certificate", "Bank Passbook Copy", "College Bonafide Certificate"],
    isNew: true,
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
    education: ["Undergraduate", "Postgraduate", "Diploma"],
    occupation: ["Student", "Unemployed"],
    casteCategory: ["All"],
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Free industry-aligned tech courses, certifications, language training, and direct campus placement support.",
    applicationDeadline: "2026-10-31",
    officialUrl: "https://www.naanmudhalvan.tn.gov.in",
    description: "Flagship skill enhancement initiative aimed at empowering 10 Lakh youth in Tamil Nadu with modern industry skills annually.",
    documents: ["Aadhaar Card", "Degree/Diploma Marksheets", "College ID Card"],
    isNew: true,
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
    education: ["All"],
    occupation: ["Self-Employed", "Homemaker", "Unemployed"],
    casteCategory: ["All"],
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Monthly basic income rights of ₹1,000 transferred to women heads of eligible households.",
    applicationDeadline: "2026-11-20",
    officialUrl: "https://kmut.tn.gov.in",
    description: "Rights-based monthly financial grant empowering women heads of families across rural and urban Tamil Nadu.",
    documents: ["Smart Family Card (Ration Card)", "Aadhaar Card", "Bank Passbook linked with Aadhaar", "Electricity Bill"],
    isNew: false,
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
    education: ["All"],
    occupation: ["All"],
    casteCategory: ["All"],
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Cashless medical insurance coverage up to ₹5 Lakhs per family per year in empanelled public and private hospitals.",
    applicationDeadline: "2026-12-31",
    officialUrl: "https://www.cmchistn.com",
    description: "Provides free health insurance coverage for low-income families in Tamil Nadu for over 1,500 medical and surgical procedures.",
    documents: ["Income Certificate", "Ration Card", "Aadhaar Card of Family Members"],
    isNew: false,
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
    education: ["Undergraduate", "Postgraduate", "Diploma", "Ph.D"],
    occupation: ["Student"],
    casteCategory: ["SC", "ST", "SCC"],
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Full tuition fee waiver, maintenance allowance, and compulsory non-refundable fees reimbursement.",
    applicationDeadline: "2026-10-15",
    officialUrl: "https://escholarship.tn.gov.in",
    description: "100% financial tuition support for Scheduled Caste and Scheduled Tribe students pursuing higher education.",
    documents: ["Community Certificate", "Income Certificate", "Bonafide Certificate", "Aadhaar Card"],
    isNew: false,
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
    education: ["Primary School"],
    occupation: ["Student"],
    casteCategory: ["All"],
    districtEligibility: "All Tamil Nadu Districts",
    benefits: "Free nutritious hot cooked morning meal on all school working days.",
    applicationDeadline: "2027-03-31",
    officialUrl: "https://www.tn.gov.in",
    description: "Pioneering state scheme providing wholesome breakfast to government primary school children across Tamil Nadu.",
    documents: ["School Student Enrollment ID", "Ration Card"],
    isNew: false,
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
    education: ["All"],
    occupation: ["Farmer"],
    casteCategory: ["All"],
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "₹6,000 annually paid in 3 equal installments of ₹2,000 directly into farmer bank accounts.",
    applicationDeadline: "2026-11-15",
    officialUrl: "https://pmkisan.gov.in",
    description: "Income support scheme for all landholding farmer families across India to meet agricultural and domestic needs.",
    documents: ["Land Ownership Documents (Chitta/Adangal)", "Aadhaar Card", "Bank Account Details"],
    isNew: true,
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
    education: ["All"],
    occupation: ["Self-Employed", "Business Owner", "Unemployed"],
    casteCategory: ["All"],
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Collateral-free business loans up to ₹50,000 (Shishu) and up to ₹5 Lakhs (Kishor) at low interest rates.",
    applicationDeadline: "2027-01-31",
    officialUrl: "https://www.mudra.org.in",
    description: "Provides financial credit for small/micro enterprise development without requiring collateral security.",
    documents: ["Business Plan Summary", "Identity & Address Proof", "Bank Statement (Last 6 Months)"],
    isNew: false,
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
    education: ["All"],
    occupation: ["All"],
    casteCategory: ["All"],
    districtEligibility: "Urban Tamil Nadu",
    benefits: "Interest subsidy up to ₹2.67 Lakhs on home loans for first-time home buyers.",
    applicationDeadline: "2026-12-31",
    officialUrl: "https://pmaymis.gov.in",
    description: "Housing for All initiative providing interest subsidy to Economically Weaker Sections (EWS) and Low Income Groups (LIG).",
    documents: ["Income Certificate", "Aadhaar Card", "Property Documents", "Declaration of No Pucca House"],
    isNew: false,
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
    education: ["Undergraduate", "Postgraduate"],
    occupation: ["Student"],
    casteCategory: ["SC", "ST", "BC"],
    districtEligibility: "Applicable in Tamil Nadu",
    benefits: "Full tuition fee payment, maintenance allowance of $15,400/year, contingency allowance, and airfare for Master's/Ph.D abroad.",
    applicationDeadline: "2026-10-30",
    officialUrl: "https://nosmsje.gov.in",
    description: "Supports low-income students from marginalized communities to pursue Master's or Ph.D degrees in reputed foreign universities.",
    documents: ["Offer Letter from Foreign University", "Caste Certificate", "Income Certificate", "Passport Copy"],
    isNew: true,
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
    read: false
  },
  {
    id: "notif-2",
    title: "Upcoming Deadline Alert!",
    message: "TN Post-Matric Scholarship deadline is in 14 days (Oct 15). Complete your application soon.",
    timestamp: "1 day ago",
    type: "deadline",
    read: false
  },
  {
    id: "notif-3",
    title: "Profile Eligibility Refresh Complete",
    message: "Based on your updated profile details, you are eligible for 6 Government Schemes!",
    timestamp: "3 days ago",
    type: "system",
    read: true
  }
];

// MOCK USER DEFAULT PROFILE
const INITIAL_MOCK_USER = {
  fullName: "Ananya Sundaram",
  email: "ananya.sundaram@example.com",
  phone: "+91 98765 43210",
  dob: "2004-05-14",
  age: 22,
  gender: "Female",
  caste: "BC",
  state: "Tamil Nadu",
  district: "Chennai",
  area: "Urban",
  income: 180000,
  occupation: "Student",
  education: "Undergraduate",
  rationCard: "Rice Card",
  disabilityStatus: "No",
  firstGenGraduate: "Yes",
  govtSchoolStudied: "Yes",
  isProfileComplete: true
};

function initMockDataStorage() {
  if (!localStorage.getItem("goscheme_schemes")) {
    localStorage.setItem("goscheme_schemes", JSON.stringify(INITIAL_SCHEMES));
  }
  if (!localStorage.getItem("goscheme_notifications")) {
    localStorage.setItem("goscheme_notifications", JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem("goscheme_saved")) {
    localStorage.setItem("goscheme_saved", JSON.stringify(["TN-001", "TN-002"]));
  }
  if (!localStorage.getItem("goscheme_user")) {
    localStorage.setItem("goscheme_user", JSON.stringify(INITIAL_MOCK_USER));
  }
}

// Execute immediately on load
initMockDataStorage();

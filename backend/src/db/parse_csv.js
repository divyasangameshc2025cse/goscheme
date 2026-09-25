const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../../../government_schemes_dataset.csv');
const jsonOutputPath = path.join(__dirname, 'schemes_dataset.json');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAge(ageStr) {
  if (!ageStr) return { minAge: 0, maxAge: 100 };
  const rangeMatch = ageStr.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return { minAge: parseInt(rangeMatch[1]), maxAge: parseInt(rangeMatch[2]) };
  }
  const plusMatch = ageStr.match(/(\d+)\s*\+/);
  if (plusMatch) {
    return { minAge: parseInt(plusMatch[1]), maxAge: 100 };
  }
  return { minAge: 0, maxAge: 100 };
}

function parseIncomeCap(incomeStr) {
  if (!incomeStr) return 9999999;
  const str = incomeStr.toLowerCase();
  if (str.includes('18 lakh')) return 1800000;
  if (str.includes('8 lakh')) return 800000;
  if (str.includes('6 lakh')) return 600000;
  if (str.includes('4.5 lakh')) return 450000;
  if (str.includes('4 lakh') || str.includes('4.0 lakh')) return 400000;
  if (str.includes('2.5 lakh')) return 250000;
  if (str.includes('1.8 lakh')) return 180000;
  if (str.includes('1.5 lakh') || str.includes('1.5 crore')) return 15000000;
  if (str.includes('1.2 lakh')) return 120000;
  if (str.includes('72,000') || str.includes('72000')) return 72000;

  const numMatch = str.match(/rs\.?\s*([\d,]+)/i);
  if (numMatch) {
    const val = parseInt(numMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 10000) return val;
  }
  return 9999999;
}

function parseEducation(edStr) {
  if (!edStr) return ["All"];
  const str = edStr.toLowerCase();
  if (str.includes('not required') || str.includes('not applicable') || str.includes('no minimum') || str.includes('all')) return ["All"];
  const list = [];
  if (str.includes('class 8') || str.includes('class 5') || str.includes('class 10') || str.includes('school')) list.push("Primary School", "High School");
  if (str.includes('class 12') || str.includes('10+2') || str.includes('higher secondary')) list.push("High School");
  if (str.includes('iti') || str.includes('diploma')) list.push("Diploma", "ITI");
  if (str.includes('undergraduate') || str.includes('degree') || str.includes('graduation')) list.push("Undergraduate");
  if (str.includes('postgraduate') || str.includes('master')) list.push("Postgraduate");
  return list.length > 0 ? list : ["All"];
}

function inferCategory(title, desc, ed) {
  const combined = (title + ' ' + desc + ' ' + ed).toLowerCase();
  if (combined.includes('health') || combined.includes('hospital') || combined.includes('insurance') || combined.includes('medical') || combined.includes('arogya') || combined.includes('cancer')) return "Healthcare";
  if (combined.includes('kisan') || combined.includes('farmer') || combined.includes('crop') || combined.includes('soil') || combined.includes('agriculture')) return "Agriculture";
  if (combined.includes('housing') || combined.includes('awas') || combined.includes('pucca house') || combined.includes('shelter')) return "Housing";
  if (combined.includes('scholarship') || combined.includes('education') || combined.includes('student') || combined.includes('school') || combined.includes('college') || combined.includes('study')) return "Scholarship & Education";
  if (combined.includes('pension') || combined.includes('senior') || combined.includes('vaya') || combined.includes('atal pension')) return "Pension & Social Security";
  if (combined.includes('women') || combined.includes('girl') || combined.includes('sukanya') || combined.includes('beti') || combined.includes('matru') || combined.includes('magalir') || combined.includes('pudhumai penn')) return "Women & Child Welfare";
  if (combined.includes('loan') || combined.includes('mudra') || combined.includes('credit') || combined.includes('entrepreneur') || combined.includes('business') || combined.includes('startup') || combined.includes('msme')) return "Entrepreneurship & Loans";
  if (combined.includes('skill') || combined.includes('training') || combined.includes('apprentice') || combined.includes('vishwakarma') || combined.includes('mudhalvan')) return "Skill Development & Employment";
  if (combined.includes('solar') || combined.includes('electricity') || combined.includes('energy') || combined.includes('lpg') || combined.includes('ujjwala') || combined.includes('bijli')) return "Solar & Energy";
  return "General Welfare & Benefits";
}

function parseCSVDataset() {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const header = parseCSVLine(lines[0]);

  const schemes = [];
  let tnCount = 0;
  let centCount = 0;
  let stateCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;

    const title = cols[0];
    const desc = cols[1];
    const docsRaw = cols[2];
    const genderRaw = cols[3];
    const ageRaw = cols[4];
    const incomeRaw = cols[5];
    const edRaw = cols[6];
    const benefits = cols[7];
    const levelRaw = cols[8];
    let officialUrl = cols[9];

    if (!officialUrl.startsWith('http')) {
      officialUrl = 'https://' + officialUrl;
    }

    let level = "Central";
    let id = "";
    if (levelRaw.toLowerCase().includes('tamil nadu') || title.toLowerCase().includes('tn ') || title.toLowerCase().includes('tamil nadu') || title.toLowerCase().includes('kalaignar') || title.toLowerCase().includes('pudhumai penn') || title.toLowerCase().includes('naan mudhalvan')) {
      level = "Tamil Nadu";
      tnCount++;
      id = `TN-${String(tnCount).padStart(3, '0')}`;
    } else if (levelRaw.toLowerCase().includes('state')) {
      level = "State";
      stateCount++;
      id = `STATE-${String(stateCount).padStart(3, '0')}`;
    } else {
      level = "Central";
      centCount++;
      id = `CENT-${String(centCount).padStart(3, '0')}`;
    }

    const { minAge, maxAge } = parseAge(ageRaw);
    const incomeCap = parseIncomeCap(incomeRaw);
    const education = parseEducation(edRaw);
    const gender = genderRaw.toLowerCase().includes('female') ? 'Female' : genderRaw.toLowerCase().includes('male') && !genderRaw.toLowerCase().includes('female') ? 'Male' : 'All';

    let documents = docsRaw ? docsRaw.split(',').map(d => d.trim()).filter(Boolean) : ["Aadhaar Card"];
    if (documents.length === 0 || documents[0].toLowerCase().includes('not applicable')) {
      documents = ["Aadhaar Card", "Income Certificate"];
    }

    const category = inferCategory(title, desc, edRaw);

    let occupation = ["All"];
    const tLower = (title + ' ' + desc).toLowerCase();
    if (tLower.includes('farmer') || tLower.includes('kisan') || tLower.includes('crop') || tLower.includes('soil')) occupation = ["Farmer"];
    else if (tLower.includes('student') || tLower.includes('scholarship') || tLower.includes('education') || tLower.includes('school') || tLower.includes('college')) occupation = ["Student"];
    else if (tLower.includes('artisan') || tLower.includes('craftsmen') || tLower.includes('vishwakarma') || tLower.includes('entrepreneur') || tLower.includes('startup') || tLower.includes('business')) occupation = ["Self-Employed", "Business Owner"];
    else if (tLower.includes('apprentice') || tLower.includes('skill') || tLower.includes('unemployed')) occupation = ["Unemployed", "Student"];

    let casteCategory = ["All"];
    if (tLower.includes('sc/st') || tLower.includes('sc / st') || tLower.includes('scheduled caste')) casteCategory = ["SC", "ST"];
    else if (tLower.includes('bc') || tLower.includes('obc')) casteCategory = ["BC", "SC", "ST"];

    schemes.push({
      id,
      title,
      department: level === 'Tamil Nadu' ? 'Govt of Tamil Nadu' : 'Govt of India',
      level,
      category,
      minAge,
      maxAge,
      gender,
      incomeCap,
      education,
      occupation,
      casteCategory,
      districtEligibility: level === 'Tamil Nadu' ? 'All Tamil Nadu Districts' : 'Applicable in Tamil Nadu & All India',
      benefits: benefits || 'Financial and social welfare support',
      applicationDeadline: '2026-12-31',
      officialUrl,
      description: desc || title,
      documents,
      isNew: i <= 20,
      status: 'Active'
    });
  }

  fs.writeFileSync(jsonOutputPath, JSON.stringify(schemes, null, 2));
  console.log(`Successfully parsed ${schemes.length} schemes from CSV (${tnCount} TN, ${centCount} Central, ${stateCount} State).`);
  return schemes;
}

if (require.main === module) {
  parseCSVDataset();
}

module.exports = { parseCSVDataset };

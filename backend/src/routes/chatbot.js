const express = require('express');
const { allAsync, getAsync } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_NIM_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const DEFAULT_NIM_MODEL = process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

const AVAILABLE_NIM_MODELS = [
  { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', name: 'NVIDIA Nemotron 3.5 Lightning (High Performance & Precision)' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'NVIDIA Nemotron 70B' },
  { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2 Instruct' },
  { id: 'deepseek-ai/deepseek-v4.1-flash', name: 'DeepSeek Flash' }
];

// Helper to calculate age from DOB
function calculateAge(dobStr) {
  if (!dobStr) return 22;
  const birth = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : 22;
}

// Strict Scheme Evaluation Engine
function evaluateSchemeEligibility(scheme, user) {
  if (!user) return { isEligible: true, matchPercent: 100, reasons: ['Complete profile to see strict eligibility'] };

  const disqualification = [];
  const matches = [];

  // 1. Gender
  if (scheme.gender !== 'All' && user.gender && scheme.gender.toLowerCase() !== user.gender.toLowerCase()) {
    disqualification.push(`Requires ${scheme.gender} gender (You specified ${user.gender})`);
  } else if (user.gender) {
    matches.push(`Gender requirement met (${user.gender})`);
  }

  // 2. Age
  const userAge = Number(user.age || 22);
  const minAge = Number(scheme.min_age !== undefined ? scheme.min_age : scheme.minAge || 0);
  const maxAge = Number(scheme.max_age !== undefined ? scheme.max_age : scheme.maxAge || 100);
  if (userAge < minAge || userAge > maxAge) {
    disqualification.push(`Age limit is ${minAge}-${maxAge} years (Your age is ${userAge})`);
  } else {
    matches.push(`Age within eligible range (${minAge}-${maxAge} years)`);
  }

  // 3. Income
  const userIncome = Number(user.income || 0);
  const incomeCap = Number(scheme.income_cap !== undefined ? scheme.income_cap : scheme.incomeCap || 9999999);
  if (userIncome > incomeCap) {
    disqualification.push(`Income ceiling is ₹${incomeCap.toLocaleString('en-IN')} (Your income is ₹${userIncome.toLocaleString('en-IN')})`);
  } else {
    matches.push(`Income ceiling met (₹${userIncome.toLocaleString('en-IN')} <= ₹${incomeCap.toLocaleString('en-IN')})`);
  }

  // 4. Education & Occupation
  let edList = [];
  let occList = [];
  try {
    edList = Array.isArray(scheme.education) ? scheme.education : JSON.parse(scheme.education || '[]');
  } catch (e) {
    edList = ['All'];
  }
  try {
    occList = Array.isArray(scheme.occupation) ? scheme.occupation : JSON.parse(scheme.occupation || '[]');
  } catch (e) {
    occList = ['All'];
  }

  const userEdu = user.education || 'All';
  const userOcc = user.occupation || 'All';
  const edMatch = edList.includes('All') || edList.includes(userEdu);
  const occMatch = occList.includes('All') || occList.includes(userOcc);

  if (!edMatch && !occMatch) {
    disqualification.push(`Requires qualification in [${edList.join(', ')}] or occupation in [${occList.join(', ')}]`);
  } else {
    matches.push(`Eligible for education (${userEdu}) & occupation (${userOcc})`);
  }

  // 5. Caste / Category
  let casteList = [];
  try {
    casteList = Array.isArray(scheme.caste_category) ? scheme.caste_category : JSON.parse(scheme.caste_category || scheme.casteCategory || '[]');
  } catch (e) {
    casteList = ['All'];
  }
  const userCaste = user.caste || 'All';
  if (!casteList.includes('All') && !casteList.includes(userCaste)) {
    disqualification.push(`Reserved for communities [${casteList.join(', ')}] (Your community is ${userCaste})`);
  } else {
    matches.push(`Community category matched (${userCaste})`);
  }

  // 6. Special condition: Pudhumai Penn Govt School rule
  if ((scheme.id === 'TN-001' || (scheme.title && scheme.title.includes('Pudhumai Penn'))) && user.govtSchoolStudied !== 'Yes') {
    disqualification.push('Requires Class 6-12 Government School study in Tamil Nadu');
  }

  const isEligible = disqualification.length === 0;
  const matchPercent = isEligible ? Math.min(100, Math.round((matches.length / 5) * 100)) : 0;

  return {
    isEligible,
    matchPercent: matchPercent >= 80 ? 100 : matchPercent,
    matches,
    disqualification
  };
}

// GET /api/chatbot/config
router.get('/config', (req, res) => {
  const serverApiKey = process.env.NVIDIA_NIM_API_KEY || process.env.NIM_API_KEY || '';
  res.json({
    success: true,
    hasServerApiKey: Boolean(serverApiKey.trim()),
    baseUrl: process.env.NVIDIA_NIM_BASE_URL || DEFAULT_NIM_BASE_URL,
    defaultModel: process.env.NVIDIA_NIM_MODEL || DEFAULT_NIM_MODEL,
    availableModels: AVAILABLE_NIM_MODELS
  });
});

// POST /api/chatbot/test-nim
router.post('/test-nim', async (req, res) => {
  const { apiKey, baseUrl, model } = req.body;
  const activeKey = apiKey || process.env.NVIDIA_NIM_API_KEY || process.env.NIM_API_KEY;
  const activeBaseUrl = baseUrl || process.env.NVIDIA_NIM_BASE_URL || DEFAULT_NIM_BASE_URL;
  const activeModel = (process.env.NVIDIA_NIM_MODEL || model || DEFAULT_NIM_MODEL).trim();

  if (!activeKey) {
    return res.status(400).json({
      success: false,
      message: 'No NVIDIA NIM API Key provided. Please provide an API key starting with nvapi-...'
    });
  }

  const startTime = Date.now();
  try {
    const endpoint = `${activeBaseUrl.replace(/\/+$/, '')}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: 'system', content: 'Respond with exactly "NVIDIA NIM Online".' },
          { role: 'user', content: 'Ping' }
        ],
        max_tokens: 16,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(35000)
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `NVIDIA NIM responded with HTTP ${response.status}: ${errText}`,
        latencyMs
      });
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || 'OK';

    return res.json({
      success: true,
      message: 'NVIDIA NIM Connection Successful!',
      model: activeModel,
      latencyMs,
      reply: replyText
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to connect to NVIDIA NIM: ${err.message}`,
      latencyMs: Date.now() - startTime
    });
  }
});

// POST /api/chatbot/chat
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      userProfile: customUserProfile,
      currentSchemeId,
      nimConfig = {}
    } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    // 1. Fetch user profile from database if token is provided and no custom profile given
    let user = customUserProfile || null;
    if (!user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.userId) {
          const userRow = await getAsync(`SELECT * FROM users WHERE id = ?`, [decoded.userId]);
          if (userRow) {
            user = {
              fullName: userRow.full_name,
              email: userRow.email,
              age: calculateAge(userRow.dob),
              gender: userRow.gender,
              caste: userRow.caste,
              state: userRow.state,
              district: userRow.district,
              income: userRow.income,
              occupation: userRow.occupation,
              education: userRow.education,
              rationCard: userRow.ration_card,
              disabilityStatus: userRow.disability_status,
              firstGenGraduate: userRow.first_gen_graduate,
              govtSchoolStudied: userRow.govt_school_studied,
              isProfileComplete: Boolean(userRow.is_profile_complete)
            };
          }
        }
      } catch (e) {
        // Silently continue with guest user profile
      }
    }

    // Default citizen profile if none provided
    if (!user) {
      user = {
        fullName: 'Citizen (Guest)',
        age: 22,
        gender: 'Female',
        caste: 'BC',
        income: 180000,
        occupation: 'Student',
        education: 'Undergraduate',
        state: 'Tamil Nadu',
        district: 'Chennai',
        rationCard: 'Rice Card',
        disabilityStatus: 'No',
        firstGenGraduate: 'Yes',
        govtSchoolStudied: 'Yes',
        isProfileComplete: false
      };
    }

    // 2. Fetch schemes from database
    const schemeRows = await allAsync(`SELECT * FROM schemes WHERE status = 'Active'`);
    const allSchemes = schemeRows.map(row => ({
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
      benefits: row.benefits,
      applicationDeadline: row.application_deadline,
      officialUrl: row.official_url,
      description: row.description,
      documents: JSON.parse(row.documents || '[]')
    }));

    // Find currentScheme if currentSchemeId is specified
    let currentScheme = null;
    if (currentSchemeId) {
      currentScheme = allSchemes.find(s => s.id === currentSchemeId) || null;
    }

    // Pre-calculate eligibility for all schemes against the fed user details
    const evaluatedSchemes = allSchemes.map(s => {
      const evaluation = evaluateSchemeEligibility(s, user);
      return {
        ...s,
        evaluation
      };
    });

    const eligibleSchemes = evaluatedSchemes.filter(s => s.evaluation.isEligible);
    const ineligibleSchemes = evaluatedSchemes.filter(s => !s.evaluation.isEligible);

    // Current scheme evaluation
    const currentSchemeEval = currentScheme ? evaluateSchemeEligibility(currentScheme, user) : null;

    // 3. Assemble Prompt with Fed User Details & Scheme Knowledge
    const userSummary = `
- Full Name: ${user.fullName || 'Citizen'}
- Age: ${user.age} years old
- Gender: ${user.gender}
- Community / Caste Category: ${user.caste}
- Annual Household Income: ₹${Number(user.income).toLocaleString('en-IN')}
- Current Occupation: ${user.occupation}
- Highest Education: ${user.education}
- State & District: ${user.state}, ${user.district || 'Tamil Nadu'}
- Studied in Tamil Nadu Govt School (Class 6-12): ${user.govtSchoolStudied || 'No'}
- First-Generation Graduate in Family: ${user.firstGenGraduate || 'No'}
- Person with Disability (PwD): ${user.disabilityStatus || 'No'}
- Ration Card: ${user.rationCard || 'Standard'}
- Profile Status: ${user.isProfileComplete ? 'Complete Verified Profile' : 'Draft / Guest Profile'}
`;

    let activeSchemeContext = '';
    if (currentScheme && currentSchemeEval) {
      activeSchemeContext = `
ACTIVE SCHEME BEING VIEWED & ANALYZED:
- Scheme ID: ${currentScheme.id}
- Title: ${currentScheme.title}
- Department: ${currentScheme.department} (${currentScheme.level})
- Category: ${currentScheme.category}
- Benefits: ${currentScheme.benefits}
- Criteria: Age ${currentScheme.minAge}-${currentScheme.maxAge}, Gender: ${currentScheme.gender}, Income Cap: ₹${currentScheme.incomeCap.toLocaleString('en-IN')}, Education: ${currentScheme.education.join(', ')}, Caste: ${currentScheme.casteCategory.join(', ')}
- Required Documents: ${currentScheme.documents.join(', ')}
- Official Application URL: ${currentScheme.officialUrl}
- Pre-evaluated Eligibility Verdict: ${currentSchemeEval.isEligible ? '✅ 100% ELIGIBLE' : '❌ NOT ELIGIBLE / DISQUALIFIED'}
- Why Eligible: ${currentSchemeEval.matches.join('; ')}
- Disqualification Reasons (if any): ${currentSchemeEval.disqualification.join('; ')}
`;
    }

    const eligibleSchemesSummary = eligibleSchemes.slice(0, 10).map(s =>
      `• [${s.id}] ${s.title} (${s.level}) - Benefits: ${s.benefits} | Match: ${s.evaluation.matchPercent}% | Category: ${s.category}`
    ).join('\n');

    const systemPrompt = `You are the official GoScheme AI Assistant powered by NVIDIA NIM inference microservice (NVIDIA Nemotron 3.5 Lightning Architecture).
Your role is to analyze government welfare schemes in Tamil Nadu and India for the citizen, based strictly on the user details fed into your context. Provide direct, beautifully structured, accurate responses without outputting internal scratchpad thinking.

CURRENT CITIZEN PROFILE FED TO YOU:
${userSummary}

${activeSchemeContext}

DATABASE OF SCHEMES MATCHING THIS CITIZEN (${eligibleSchemes.length} schemes found 100% eligible):
${eligibleSchemesSummary}

KEY INSTRUCTIONS FOR ANALYSIS:
1. Always analyze schemes specifically with respect to the user's fed parameters (Age: ${user.age}, Gender: ${user.gender}, Income: ₹${Number(user.income).toLocaleString('en-IN')}, Caste: ${user.caste}, Occupation: ${user.occupation}, Education: ${user.education}, Govt School: ${user.govtSchoolStudied}).
2. When asked about eligibility or scheme analysis, provide a structured breakdown:
   - 🎯 **Eligibility Verdict**: (100% Eligible or Ineligible with clear reason)
   - 💰 **Benefits**: Exact financial or material assistance
   - 📋 **Why You Qualify / Points of Attention**: Explicitly check each parameter against criteria
   - 📑 **Required Documents Checklist**: Bulleted list of paperwork needed
   - 🚀 **How to Apply**: Clear action steps and guidance
3. If the citizen asks to analyze a specific scheme (like Pudhumai Penn, Moovalur Ramamirtham, Kalaignar Magalir Urimai, PM-KISAN, Naan Mudhalvan, Free Laptop, etc.), look up the exact details from the database and give an accurate, comprehensive analysis.
4. If the citizen is ineligible for a scheme, explain the exact disqualifying condition gently and suggest 1-2 alternate schemes they DO qualify for.
5. If the citizen wants to test a "what-if" scenario (e.g. "What if my income was 2 lakhs?" or "What if I was a postgraduate?"), recalculate dynamically.
6. Tone: Warm, respectful, authoritative, transparent, and encouraging. Use clean Markdown (bold text, bullet points, emojis where appropriate).
7. If the user writes in Tamil, reply in Tamil (or Tanglish if user prefers). Otherwise, reply in English.`;

    // 4. Determine NVIDIA NIM Credentials & Endpoint (Prioritize model in .env)
    const activeApiKey = (process.env.NVIDIA_NIM_API_KEY || nimConfig.apiKey || process.env.NIM_API_KEY || '').trim();
    const activeBaseUrl = (process.env.NVIDIA_NIM_BASE_URL || nimConfig.baseUrl || DEFAULT_NIM_BASE_URL).trim();
    const activeModel = (process.env.NVIDIA_NIM_MODEL || nimConfig.model || DEFAULT_NIM_MODEL).trim();

    // Clean and prepare message history (up to last 16 messages for continuous multi-page memory)
    const formattedHistory = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-16)) {
        if (h && (h.role === 'user' || h.role === 'assistant') && h.content) {
          formattedHistory.push({ role: h.role, content: String(h.content) });
        }
      }
    }

    // 5. Try calling live NVIDIA NIM if API Key is available
    if (activeApiKey) {
      try {
        const nimEndpoint = `${activeBaseUrl.replace(/\/+$/, '')}/chat/completions`;
        const nimPayload = {
          model: activeModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...formattedHistory,
            { role: 'user', content: message }
          ],
          temperature: 0.2,
          max_tokens: 1024,
          top_p: 0.8
        };

        const nimRes = await fetch(nimEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(nimPayload),
          signal: AbortSignal.timeout(15000)
        });

        if (nimRes.ok) {
          const nimData = await nimRes.json();
          let replyText = nimData.choices?.[0]?.message?.content;
          if (!replyText && nimData.choices?.[0]?.message?.reasoning_content) {
            replyText = nimData.choices[0].message.reasoning_content;
          }
          if (replyText) {
            // Clean up any internal raw thought blocks if present
            replyText = replyText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            return res.json({
              success: true,
              reply: replyText,
              provider: 'NVIDIA NIM',
              model: activeModel,
              evaluatedCount: eligibleSchemes.length,
              activeScheme: currentScheme ? currentScheme.title : null
            });
          }
        } else {
          const errText = await nimRes.text();
          console.warn(`NVIDIA NIM returned ${nimRes.status}:`, errText);
        }
      } catch (nimErr) {
        console.warn('NVIDIA NIM call failed or timed out, falling back to local analysis engine:', nimErr.message);
      }
    }

    // 6. Intelligent Local Fallback Engine (Guarantees immediate responsiveness even before user configures NIM key)
    const localReply = generateLocalSchemeAnalysis({
      message,
      history: formattedHistory,
      user,
      currentScheme,
      currentSchemeEval,
      eligibleSchemes,
      ineligibleSchemes,
      allSchemes
    });

    return res.json({
      success: true,
      reply: localReply,
      provider: activeApiKey ? 'NVIDIA NIM (Fallback Engine)' : 'GoScheme Intelligent Scheme Engine (NVIDIA NIM Ready)',
      model: activeApiKey ? activeModel : `${DEFAULT_NIM_MODEL} (Simulated)`,
      requiresApiKey: !activeApiKey,
      evaluatedCount: eligibleSchemes.length,
      activeScheme: currentScheme ? currentScheme.title : null
    });

  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({ success: false, message: 'Internal error in chatbot processing', error: err.message });
  }
});

// Deterministic Rich Scheme Analysis Fallback Engine
function generateLocalSchemeAnalysis({
  message,
  history = [],
  user,
  currentScheme,
  currentSchemeEval,
  eligibleSchemes,
  ineligibleSchemes,
  allSchemes
}) {
  const lowerMsg = message.toLowerCase();

  // Multi-turn conversational memory: if no active currentScheme, detect if previous turns referenced a scheme
  let contextualScheme = currentScheme;
  let contextualSchemeEval = currentSchemeEval;

  if (!contextualScheme && Array.isArray(history) && history.length > 0) {
    const combinedHistory = history.map(h => h.content || '').join(' ').toLowerCase();
    contextualScheme = allSchemes.find(s =>
      combinedHistory.includes(s.title.toLowerCase()) ||
      combinedHistory.includes(s.id.toLowerCase())
    );
    if (contextualScheme) {
      contextualSchemeEval = evaluateSchemeEligibility(contextualScheme, user);
    }
  }

  // If user asks to analyze active or contextually remembered scheme
  if (contextualScheme && (lowerMsg.includes('this scheme') || lowerMsg.includes('analyze') || lowerMsg.includes('eligible') || lowerMsg.includes('document') || lowerMsg.includes('apply') || lowerMsg.includes(contextualScheme.title.toLowerCase()) || lowerMsg.includes(contextualScheme.id.toLowerCase()))) {
    const isEligible = contextualSchemeEval ? contextualSchemeEval.isEligible : true;
    const matchScore = contextualSchemeEval ? contextualSchemeEval.matchPercent : 100;

    let response = `### 🏛️ Scheme Analysis: **${contextualScheme.title}** (${contextualScheme.id})\n\n`;
    response += `**Department:** ${contextualScheme.department} | **Level:** ${contextualScheme.level}\n\n`;
    response += `**Citizen Evaluated:** ${user.fullName} (${user.gender}, ${user.age} yrs, ${user.caste}, Income ₹${Number(user.income).toLocaleString('en-IN')})\n\n`;

    if (isEligible) {
      response += `#### 🎯 Eligibility Verdict: **100% ELIGIBLE (Match Score: ${matchScore}%)**\n`;
      response += `Great news! You meet all mandatory criteria set by the Tamil Nadu Government for this scheme.\n\n`;
      response += `#### 💰 Key Benefits & Financial Aid:\n${contextualScheme.benefits || 'Financial assistance provided as per government guidelines'}\n\n`;
      response += `#### 📋 Why You Qualify:\n`;
      if (contextualSchemeEval && Array.isArray(contextualSchemeEval.matches)) {
        contextualSchemeEval.matches.forEach(m => {
          response += `- ✅ **${m}**\n`;
        });
      }
      response += `\n#### 📑 Required Documents to Keep Ready:\n`;
      if (Array.isArray(contextualScheme.documents)) {
        contextualScheme.documents.forEach(doc => {
          response += `- 📄 **${doc}**\n`;
        });
      }
      response += `\n#### 🚀 Next Steps to Apply:\n`;
      response += `1. Verify you have soft copies of all listed certificates.\n`;
      response += `2. Visit the official portal: [**Official Application Portal**](${contextualScheme.officialUrl || '#'}) or visit your local e-Sevai Center / District Collectorate.\n`;
      response += `3. Application Deadline: **${contextualScheme.applicationDeadline || 'Rolling / Open'}**.\n`;
    } else {
      response += `#### 🎯 Eligibility Verdict: **DISQUALIFIED / NOT ELIGIBLE**\n\n`;
      response += `Based on the criteria, your current profile does not qualify for this specific scheme due to:\n`;
      if (contextualSchemeEval && Array.isArray(contextualSchemeEval.disqualification)) {
        contextualSchemeEval.disqualification.forEach(d => {
          response += `- ❌ **${d}**\n`;
        });
      }
      response += `\n#### 💡 Alternative Schemes You DO Qualify For:\n`;
      eligibleSchemes.slice(0, 3).forEach(s => {
        response += `- [**${s.title}**](${s.officialUrl || '#'}) (${s.category}) — Benefits: *${s.benefits}*\n`;
      });
      response += `\n*Tip: You can update your profile parameters in the Citizen Details card above to recalculate.*`;
    }

    return response;
  }

  // If user asks about their general eligibility or "my schemes" or "what schemes"
  if (lowerMsg.includes('my eligibility') || lowerMsg.includes('eligible') || lowerMsg.includes('best schemes') || lowerMsg.includes('recommend') || lowerMsg.includes('what can i apply')) {
    let response = `### 🎯 Scheme Eligibility Report for **${user.fullName}**\n\n`;
    response += `**Fed Profile:** Age **${user.age}** | Gender **${user.gender}** | Category **${user.caste}** | Income **₹${Number(user.income).toLocaleString('en-IN')}** | Education **${user.education}** | Occupation **${user.occupation}**\n\n`;
    response += `Out of all government schemes analyzed, you qualify for **${eligibleSchemes.length} active welfare schemes**!\n\n`;

    response += `#### 🌟 Top Schemes Matching Your Profile:\n\n`;
    eligibleSchemes.slice(0, 5).forEach((s, idx) => {
      response += `**${idx + 1}. [${s.title}](scheme-details.html?id=${s.id})** (${s.level} • ${s.category})\n`;
      response += `- 💰 **Benefit:** ${s.benefits}\n`;
      response += `- 🎯 **Match Score:** ${s.evaluation.matchPercent}%\n`;
      response += `- 📑 **Key Documents:** ${s.documents.slice(0, 3).join(', ')}\n\n`;
    });

    response += `💡 *Ask me to analyze any specific scheme in detail (e.g., "Analyze Pudhumai Penn" or "Tell me about Naan Mudhalvan")!*`;
    return response;
  }

  // If user asks about documents
  if (lowerMsg.includes('document') || lowerMsg.includes('certificate') || lowerMsg.includes('aadhaar')) {
    let response = `### 📑 Comprehensive Documents Guide for Government Schemes\n\n`;
    response += `For your profile (**${user.gender}**, **${user.caste}**, **${user.occupation}** in ${user.state}), the essential documents required for seamless application are:\n\n`;
    response += `1. **Aadhaar Card** (Linked with active mobile number for OTP e-KYC)\n`;
    response += `2. **Community Certificate** (Issued by Tahsildar / Revenue Department confirming **${user.caste}** status)\n`;
    response += `3. **Income Certificate** (Current financial year, showing income <= ₹${Number(user.income).toLocaleString('en-IN')})\n`;
    response += `4. **Nativity / Residence Certificate** (Proving Tamil Nadu residency)\n`;
    if (user.occupation === 'Student' || user.education) {
      response += `5. **Bonafide Student Certificate / College ID Card** & Marksheets\n`;
      if (user.govtSchoolStudied === 'Yes') {
        response += `6. **EMIS Govt School Study Certificate** (Class 6-12 Government School verification from Headmaster)\n`;
      }
    }
    response += `7. **Bank Passbook Copy** (Aadhaar Seeded / DBT Enabled Savings Account)\n`;
    response += `8. **Smart Ration Card** (${user.rationCard || 'Family card'})\n\n`;
    response += `*Need help with a specific scheme's requirements? Just ask!*`;
    return response;
  }

  // If user asks about a specific scheme by name
  const matchedScheme = allSchemes.find(s =>
    lowerMsg.includes(s.title.toLowerCase()) ||
    lowerMsg.includes(s.id.toLowerCase()) ||
    (s.title.toLowerCase().includes('pudhumai') && lowerMsg.includes('pudhumai')) ||
    (s.title.toLowerCase().includes('urimai') && lowerMsg.includes('urimai')) ||
    (s.title.toLowerCase().includes('kisan') && lowerMsg.includes('kisan')) ||
    (s.title.toLowerCase().includes('mudhalvan') && lowerMsg.includes('mudhalvan')) ||
    (s.title.toLowerCase().includes('muthulakshmi') && lowerMsg.includes('muthulakshmi')) ||
    (s.title.toLowerCase().includes('laptop') && lowerMsg.includes('laptop'))
  );

  if (matchedScheme) {
    const sEval = evaluateSchemeEligibility(matchedScheme, user);
    let response = `### 🏛️ Scheme Intelligence: **${matchedScheme.title}** (${matchedScheme.id})\n\n`;
    response += `**Department:** ${matchedScheme.department} | **Level:** ${matchedScheme.level}\n\n`;
    response += `**Eligibility Status for You:** ${sEval.isEligible ? '✅ **100% Eligible**' : '❌ **Ineligible**'}\n\n`;
    response += `**Benefits:**\n${matchedScheme.benefits}\n\n`;

    if (sEval.isEligible) {
      response += `**Why You Qualify:**\n`;
      sEval.matches.forEach(m => response += `- ✅ ${m}\n`);
    } else {
      response += `**Disqualification Points:**\n`;
      sEval.disqualification.forEach(d => response += `- ❌ ${d}\n`);
    }

    response += `\n**Required Documents:**\n`;
    matchedScheme.documents.forEach(d => response += `- 📄 ${d}\n`);
    response += `\n[**View Scheme Details Page**](scheme-details.html?id=${matchedScheme.id}) • [**Official Portal**](${matchedScheme.officialUrl})`;
    return response;
  }

  // General helpful response with citizen context
  return `Hello ${user.fullName.split(' ')[0]}! 👋 I am your **GoScheme AI Advisor powered by NVIDIA NIM**.\n\n` +
    `I have analyzed our database against your fed profile:\n` +
    `- **Age & Gender:** ${user.age} yrs • ${user.gender}\n` +
    `- **Community:** ${user.caste}\n` +
    `- **Income:** ₹${Number(user.income).toLocaleString('en-IN')}/year\n` +
    `- **Status:** ${user.occupation} (${user.education})\n\n` +
    `You are currently **eligible for ${eligibleSchemes.length} welfare schemes**!\n\n` +
    `How can I assist you today?\n` +
    `- 🎯 Ask *"Analyze my eligibility"* for a full breakdown.\n` +
    `- 🔍 Ask *"Analyze Pudhumai Penn"* or any specific scheme.\n` +
    `- 📑 Ask *"What documents do I need?"* for paperwork guidelines.\n`
}

module.exports = router;

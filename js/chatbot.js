/* ==========================================================================
   GO SCHEME - AI Scheme Advisor (NVIDIA NIM Inference Microservice)
   Floating Bottom-Right Intelligent Chatbot Client
   ========================================================================== */

(function () {
  'use strict';

  // Global State
  const chatbotState = {
    isOpen: false,
    isProfileDrawerOpen: false,
    isSettingsModalOpen: false,
    isLoading: false,
    history: [],
    currentSchemeId: null,
    currentSchemeTitle: null,
    nimConfig: {
      apiKey: '',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      model: 'meta/llama-3.1-70b-instruct'
    },
    userProfile: {
      fullName: 'Citizen',
      age: 22,
      gender: 'Female',
      caste: 'BC',
      income: 180000,
      occupation: 'Student',
      education: 'Undergraduate',
      state: 'Tamil Nadu',
      district: 'Chennai',
      govtSchoolStudied: 'Yes',
      firstGenGraduate: 'Yes',
      disabilityStatus: 'No',
      rationCard: 'Rice Card',
      isProfileComplete: false
    }
  };

  // Helper to load NIM config from localStorage
  function loadNimConfig() {
    try {
      const saved = localStorage.getItem('goscheme_nim_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        chatbotState.nimConfig = { ...chatbotState.nimConfig, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load NIM config:', e);
    }
  }

  function saveNimConfig(cfg) {
    chatbotState.nimConfig = { ...chatbotState.nimConfig, ...cfg };
    localStorage.setItem('goscheme_nim_config', JSON.stringify(chatbotState.nimConfig));
  }

  // Load User Profile from existing GoScheme session
  function loadUserProfile() {
    try {
      const stored = localStorage.getItem('goscheme_user');
      if (stored) {
        const u = JSON.parse(stored);
        chatbotState.userProfile = {
          fullName: u.fullName || u.full_name || 'Citizen',
          age: u.age || (u.dob ? calculateAgeFromDOB(u.dob) : 22),
          gender: u.gender || 'Female',
          caste: u.caste || 'BC',
          income: Number(u.income) || 180000,
          occupation: u.occupation || 'Student',
          education: u.education || 'Undergraduate',
          state: u.state || 'Tamil Nadu',
          district: u.district || 'Chennai',
          govtSchoolStudied: u.govtSchoolStudied || u.govt_school_studied || 'Yes',
          firstGenGraduate: u.firstGenGraduate || u.first_gen_graduate || 'Yes',
          disabilityStatus: u.disabilityStatus || u.disability_status || 'No',
          rationCard: u.rationCard || u.ration_card || 'Rice Card',
          isProfileComplete: Boolean(u.isProfileComplete || u.is_profile_complete)
        };
      }
    } catch (e) {
      console.warn('Failed to load user profile for chatbot:', e);
    }
  }

  function calculateAgeFromDOB(dobStr) {
    if (!dobStr) return 22;
    const birth = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : 22;
  }

  // Detect current scheme on page (e.g. scheme-details.html?id=TN-001)
  function detectCurrentScheme() {
    const urlParams = new URLSearchParams(window.location.search);
    const schemeId = urlParams.get('id');
    if (schemeId) {
      chatbotState.currentSchemeId = schemeId;
      // Try to find title from page or mock data
      const titleElem = document.querySelector('h1, .scheme-detail-title, .scheme-title');
      if (titleElem && titleElem.textContent) {
        chatbotState.currentSchemeTitle = titleElem.textContent.trim();
      } else if (typeof INITIAL_SCHEMES !== 'undefined') {
        const found = INITIAL_SCHEMES.find(s => s.id === schemeId);
        if (found) chatbotState.currentSchemeTitle = found.title;
      }
    }
  }

  // Clean Markdown Renderer for Chat Bubbles
  function renderMarkdown(text) {
    if (!text) return '';
    let html = text;

    // Sanitize HTML tags except allowed
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Markdown Links [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 &nearr;</a>');

    // Bullet Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');

    // Line breaks to paragraphs
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h3>') || p.startsWith('<h4>') || p.startsWith('<ul>') || p.startsWith('<ol>')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  }

  // Initialize and mount DOM elements
  function mountChatbotUI() {
    if (document.getElementById('goscheme-chatbot-root')) return;

    const root = document.createElement('div');
    root.id = 'goscheme-chatbot-root';

    root.innerHTML = `
      <!-- Floating Launcher Button (Bottom Right) -->
      <div class="goscheme-chatbot-launcher" id="goscheme-chatbot-launcher" title="AI Scheme Advisor" role="button" tabindex="0">
        <div class="goscheme-launcher-avatar">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2zm0-10h2v8h-2z"/>
          </svg>
          <div class="goscheme-launcher-pulse"></div>
        </div>
        <div class="goscheme-launcher-text">
          <div class="goscheme-launcher-title">
            <span>AI Advisor</span>
          </div>
          <div class="goscheme-launcher-sub">Analyze Schemes & Eligibility</div>
        </div>
      </div>

      <!-- Chatbot Window -->
      <div class="goscheme-chatbot-window" id="goscheme-chatbot-window" role="dialog" aria-label="GoScheme AI Chatbot">
        <!-- Header -->
        <div class="goscheme-chat-header">
          <div class="goscheme-header-brand">
            <div class="goscheme-header-avatar">
              <svg viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <div class="goscheme-online-indicator"></div>
            </div>
            <div class="goscheme-header-info">
              <div class="goscheme-header-title">
                <span>GoScheme AI</span>
              </div>
              <div class="goscheme-header-sub">Online Scheme Assistant</div>
            </div>
          </div>
          <div class="goscheme-header-actions">
            <button class="goscheme-icon-btn" id="goscheme-btn-open-settings" title="NVIDIA NIM Settings">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>
            </button>
            <button class="goscheme-icon-btn" id="goscheme-btn-clear" title="Clear Conversation">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            <button class="goscheme-icon-btn" id="goscheme-btn-close" title="Close Chat">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Active Scheme Being Analyzed Strip -->
        <div class="goscheme-active-scheme-strip" id="goscheme-active-scheme-strip" style="display: none;">
          <div class="goscheme-scheme-strip-title" id="goscheme-scheme-strip-title">
            <span>🏛️</span>
            <span id="goscheme-scheme-strip-text">Viewing Scheme</span>
          </div>
          <div class="goscheme-scheme-strip-action" id="goscheme-scheme-strip-action">Analyze Now &rarr;</div>
        </div>

        <!-- Quick Action Chips -->
        <div class="goscheme-quick-chips" id="goscheme-quick-chips">
          <button class="goscheme-chip active-scheme-chip" id="chip-analyze-current" style="display: none;">
            🔍 Analyze Current Scheme
          </button>
          <button class="goscheme-chip" data-prompt="Analyze my eligibility for all welfare schemes">
            🎯 Check My Eligibility
          </button>
          <button class="goscheme-chip" data-prompt="What are the top Tamil Nadu government schemes for me?">
            🌟 Top TN Schemes
          </button>
          <button class="goscheme-chip" data-prompt="What documents and certificates do I need to prepare?">
            📑 Required Documents
          </button>
          <button class="goscheme-chip" data-prompt="Analyze Pudhumai Penn Scheme (Moovalur Higher Education)">
            🎓 Pudhumai Penn Scheme
          </button>
          <button class="goscheme-chip" data-prompt="Analyze Kalaignar Magalir Urimai Thogai Scheme">
            👩 Magalir Urimai Scheme
          </button>
        </div>

        <!-- Messages Area -->
        <div class="goscheme-chat-messages" id="goscheme-chat-messages">
          <!-- Rendered dynamically -->
        </div>

        <!-- Input Bar -->
        <div class="goscheme-chat-input-bar">
          <textarea
            class="goscheme-chat-input"
            id="goscheme-chat-input"
            placeholder="Ask about your eligibility or any scheme..."
            rows="1"
          ></textarea>
          <button class="goscheme-send-btn" id="goscheme-send-btn" title="Send message">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </button>
        </div>
      </div>

      <!-- NVIDIA NIM Configuration Modal -->
      <div class="goscheme-nim-modal-overlay" id="goscheme-nim-modal">
        <div class="goscheme-nim-modal-container">
          <div class="goscheme-nim-modal-header">
            <div class="goscheme-nim-modal-title">
              <svg width="22" height="22" fill="#76B900" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span>NVIDIA NIM Configuration</span>
            </div>
            <button class="goscheme-icon-btn" id="goscheme-btn-close-settings">✕</button>
          </div>
          <div class="goscheme-nim-modal-body">
            <div class="goscheme-nim-field">
              <label>NVIDIA NIM API Key</label>
              <input type="password" id="nim-cfg-api-key" placeholder="nvapi-..." autocomplete="off">
              <div class="goscheme-nim-help">
                Get your API key at <a href="https://build.nvidia.com" target="_blank" rel="noopener">build.nvidia.com</a>.
              </div>
            </div>
            <div class="goscheme-nim-field">
              <label>NVIDIA NIM Base URL</label>
              <input type="text" id="nim-cfg-base-url" value="https://integrate.api.nvidia.com/v1">
            </div>
            <div class="goscheme-nim-test-result" id="nim-test-result"></div>
          </div>
          <div class="goscheme-nim-modal-footer">
            <button class="btn btn-outline btn-sm" id="goscheme-btn-test-nim" type="button">Test Connection ⚡</button>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline btn-sm" id="goscheme-btn-cancel-settings" type="button">Cancel</button>
              <button class="btn btn-primary btn-sm" id="goscheme-btn-save-settings" type="button" style="background: #76B900; border-color: #76B900;">Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    attachEventHandlers();
    updateFedProfileDisplay();
    checkActiveScheme();
    sendWelcomeMessage();
  }

  // Update fed profile in background
  function updateFedProfileDisplay() {
    loadUserProfile();
  }

  // Check if viewing a specific scheme
  function checkActiveScheme() {
    detectCurrentScheme();
    const strip = document.getElementById('goscheme-active-scheme-strip');
    const stripText = document.getElementById('goscheme-scheme-strip-text');
    const chip = document.getElementById('chip-analyze-current');

    if (chatbotState.currentSchemeId) {
      const title = chatbotState.currentSchemeTitle || chatbotState.currentSchemeId;
      if (strip) strip.style.display = 'flex';
      if (stripText) stripText.textContent = `Analyzing: ${title}`;
      if (chip) {
        chip.style.display = 'inline-flex';
        chip.textContent = `🔍 Analyze ${chatbotState.currentSchemeId}`;
      }
    } else {
      if (strip) strip.style.display = 'none';
      if (chip) chip.style.display = 'none';
    }
  }

  // Send Initial Bot Welcome
  function sendWelcomeMessage() {
    if (chatbotState.history.length > 0) return;

    const p = chatbotState.userProfile;
    let initialText = `Hello **${p.fullName.split(' ')[0]}**! 👋 I am your **GoScheme AI Advisor**.\n\n`;

    if (chatbotState.currentSchemeId) {
      initialText += `📌 You are currently viewing: **${chatbotState.currentSchemeTitle || chatbotState.currentSchemeId}**.\n\n`;
      initialText += `Click **"Analyze Current Scheme"** or tap any prompt below to check your eligibility, benefits, and required paperwork!`;
    } else {
      initialText += `I can analyze your eligibility across all Tamil Nadu and Central Government welfare schemes, explain benefits, and guide you on required documents.\n\n`;
      initialText += `Click **"Check My Eligibility"** or ask me about any welfare scheme to get started!`;
    }

    streamBotMessage(initialText);
  }

  // Stream / Type Bot Message with Realistic Typing Effect
  function streamBotMessage(fullText, meta = null, callback = null) {
    const container = document.getElementById('goscheme-chat-messages');
    if (!container) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgObj = { role: 'bot', text: fullText, meta, timestamp };
    chatbotState.history.push(msgObj);

    const msgRow = document.createElement('div');
    msgRow.className = 'goscheme-msg goscheme-msg-bot';

    msgRow.innerHTML = `
      <div class="goscheme-msg-avatar bot">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <div class="goscheme-msg-content">
        <div class="goscheme-msg-bubble">
          <span class="goscheme-typed-content"></span><span class="goscheme-typing-cursor">▌</span>
        </div>
        <div class="goscheme-msg-meta" style="opacity: 0; transition: opacity 0.3s ease;">
          <span>${timestamp}</span>
          <span>•</span>
          <button class="goscheme-copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(fullText)}).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 1500); })">Copy</button>
        </div>
      </div>
    `;

    container.appendChild(msgRow);
    container.scrollTop = container.scrollHeight;

    const bubbleSpan = msgRow.querySelector('.goscheme-typed-content');
    const cursor = msgRow.querySelector('.goscheme-typing-cursor');
    const metaRow = msgRow.querySelector('.goscheme-msg-meta');

    // Split text into word / whitespace tokens for fluid progressive rendering
    const tokens = fullText.split(/(\s+)/);
    let index = 0;
    let accumulatedText = '';
    chatbotState.isTypingActive = true;

    // Fluid typing speed
    const intervalMs = Math.max(10, Math.min(26, Math.floor(2600 / Math.max(tokens.length, 1))));

    const timer = setInterval(() => {
      if (!chatbotState.isTypingActive || index >= tokens.length) {
        clearInterval(timer);
        chatbotState.isTypingActive = false;
        bubbleSpan.innerHTML = renderMarkdown(fullText);
        if (cursor) cursor.remove();
        if (metaRow) metaRow.style.opacity = '1';
        container.scrollTop = container.scrollHeight;
        if (callback) callback();
        return;
      }

      accumulatedText += tokens[index];
      index++;

      bubbleSpan.innerHTML = renderMarkdown(accumulatedText);
      container.scrollTop = container.scrollHeight;
    }, intervalMs);
  }

  // Add Static Message to Chat History & DOM (Instant, for user messages)
  function addMessage(role, text, meta = null) {
    chatbotState.history.push({ role, text, meta, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    renderLatestMessage();
  }

  function renderLatestMessage() {
    const container = document.getElementById('goscheme-chat-messages');
    if (!container) return;

    const msg = chatbotState.history[chatbotState.history.length - 1];
    if (!msg) return;

    const msgRow = document.createElement('div');
    msgRow.className = `goscheme-msg ${msg.role === 'user' ? 'goscheme-msg-user' : 'goscheme-msg-bot'}`;

    if (msg.role === 'bot') {
      msgRow.innerHTML = `
        <div class="goscheme-msg-avatar bot">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div class="goscheme-msg-content">
          <div class="goscheme-msg-bubble">${renderMarkdown(msg.text)}</div>
          <div class="goscheme-msg-meta">
            <span>${msg.timestamp}</span>
            <span>•</span>
            <button class="goscheme-copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(msg.text)}).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 1500); })">Copy</button>
          </div>
        </div>
      `;
    } else {
      msgRow.innerHTML = `
        <div class="goscheme-msg-avatar user">
          <span>${chatbotState.userProfile.fullName ? chatbotState.userProfile.fullName.charAt(0).toUpperCase() : 'U'}</span>
        </div>
        <div class="goscheme-msg-content">
          <div class="goscheme-msg-bubble">${renderMarkdown(msg.text)}</div>
          <div class="goscheme-msg-meta">
            <span>${msg.timestamp}</span>
          </div>
        </div>
      `;
    }

    container.appendChild(msgRow);
    container.scrollTop = container.scrollHeight;
  }

  // Show / Hide Typing Indicator
  function setTyping(isTyping) {
    chatbotState.isLoading = isTyping;
    const container = document.getElementById('goscheme-chat-messages');
    const existing = document.getElementById('goscheme-typing-row');
    const sendBtn = document.getElementById('goscheme-send-btn');

    if (sendBtn) sendBtn.disabled = isTyping;

    if (isTyping) {
      if (!existing && container) {
        const row = document.createElement('div');
        row.id = 'goscheme-typing-row';
        row.className = 'goscheme-msg goscheme-msg-bot';
        row.innerHTML = `
          <div class="goscheme-msg-avatar bot">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div class="goscheme-msg-content">
            <div class="goscheme-typing-indicator">
              <span></span><span></span><span></span>
              <div class="goscheme-typing-text">AI is typing...</div>
            </div>
          </div>
        `;
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;
      }
    } else {
      if (existing) existing.remove();
    }
  }

  // Send User Message to Backend API
  async function handleSendMessage(msgText) {
    const text = (msgText || '').trim();
    if (!text || chatbotState.isLoading) return;

    // Interrupt any ongoing typing effect
    chatbotState.isTypingActive = false;

    addMessage('user', text);
    setTyping(true);

    // Prepare API request payload
    const payload = {
      message: text,
      history: chatbotState.history.slice(-8).map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      userProfile: chatbotState.userProfile,
      currentSchemeId: chatbotState.currentSchemeId,
      nimConfig: chatbotState.nimConfig
    };

    try {
      const token = localStorage.getItem('goscheme_jwt_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/chatbot/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setTyping(false);

      if (data && data.success && data.reply) {
        streamBotMessage(data.reply, {
          provider: data.provider
        });
      } else {
        streamBotMessage('⚠️ ' + (data?.message || 'Unable to analyze scheme at this moment. Please check backend server.'));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setTyping(false);
      // Fallback local response if backend cannot be reached
      streamBotMessage(`⚠️ Could not reach GoScheme API server at http://localhost:5000. Please ensure the backend is running with \`npm start\`.`);
    }
  }

  // Attach All Event Handlers
  function attachEventHandlers() {
    const launcher = document.getElementById('goscheme-chatbot-launcher');
    const windowElem = document.getElementById('goscheme-chatbot-window');
    const btnClose = document.getElementById('goscheme-btn-close');
    const btnClear = document.getElementById('goscheme-btn-clear');
    const stripAction = document.getElementById('goscheme-scheme-strip-action');

    const input = document.getElementById('goscheme-chat-input');
    const sendBtn = document.getElementById('goscheme-send-btn');
    const chipsContainer = document.getElementById('goscheme-quick-chips');

    // Settings Modal
    const btnOpenSettings = document.getElementById('goscheme-btn-open-settings');
    const modalSettings = document.getElementById('goscheme-nim-modal');
    const btnCloseSettings = document.getElementById('goscheme-btn-close-settings');
    const btnCancelSettings = document.getElementById('goscheme-btn-cancel-settings');
    const btnSaveSettings = document.getElementById('goscheme-btn-save-settings');
    const btnTestNim = document.getElementById('goscheme-btn-test-nim');

    // Launcher Click
    if (launcher) {
      launcher.addEventListener('click', () => {
        chatbotState.isOpen = !chatbotState.isOpen;
        if (chatbotState.isOpen) {
          windowElem.classList.add('active');
          launcher.style.display = 'none';
          if (input) input.focus();
        }
      });
    }

    // Close Button
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        chatbotState.isOpen = false;
        windowElem.classList.remove('active');
        if (launcher) launcher.style.display = 'flex';
      });
    }

    // Clear Button
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        chatbotState.isTypingActive = false;
        chatbotState.history = [];
        const msgContainer = document.getElementById('goscheme-chat-messages');
        if (msgContainer) msgContainer.innerHTML = '';
        sendWelcomeMessage();
      });
    }

    // Active Scheme Strip Click
    if (stripAction) {
      stripAction.addEventListener('click', () => {
        const title = chatbotState.currentSchemeTitle || chatbotState.currentSchemeId || 'this scheme';
        handleSendMessage(`Analyze the scheme "${title}" in detail for my fed profile.`);
      });
    }

    // Quick Action Chips Click
    if (chipsContainer) {
      chipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.goscheme-chip');
        if (!chip) return;

        if (chip.id === 'chip-analyze-current') {
          const title = chatbotState.currentSchemeTitle || chatbotState.currentSchemeId || 'this scheme';
          handleSendMessage(`Analyze the scheme "${title}" in detail for my fed profile.`);
          return;
        }

        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          handleSendMessage(prompt);
        }
      });
    }

    // Send Button & Enter Key in Input
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const text = input.value;
        input.value = '';
        input.style.height = 'auto';
        handleSendMessage(text);
      });
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = input.value;
          input.value = '';
          input.style.height = 'auto';
          handleSendMessage(text);
        }
      });

      // Auto resize input height
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 80) + 'px';
      });
    }

    // Settings Modal
    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', () => {
        document.getElementById('nim-cfg-api-key').value = chatbotState.nimConfig.apiKey || '';
        document.getElementById('nim-cfg-base-url').value = chatbotState.nimConfig.baseUrl || 'https://integrate.api.nvidia.com/v1';
        document.getElementById('nim-test-result').style.display = 'none';
        modalSettings.classList.add('active');
      });
    }

    function closeModal() {
      modalSettings.classList.remove('active');
    }

    if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeModal);
    if (btnCancelSettings) btnCancelSettings.addEventListener('click', closeModal);

    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const key = document.getElementById('nim-cfg-api-key').value.trim();
        const baseUrl = document.getElementById('nim-cfg-base-url').value.trim();

        saveNimConfig({ apiKey: key, baseUrl });
        updateFedProfileDisplay();
        closeModal();

        addMessage('bot', `⚙️ **NVIDIA NIM Configuration Saved!**\n- **API Key:** ${key ? 'Configured (nvapi-***)' : 'Not set (using Local Engine)'}\n- **Base URL:** \`${baseUrl}\``);
      });
    }

    // Test NIM Connection Button
    if (btnTestNim) {
      btnTestNim.addEventListener('click', async () => {
        const key = document.getElementById('nim-cfg-api-key').value.trim();
        const model = chatbotState.nimConfig.model || 'meta/llama-3.1-70b-instruct';
        const baseUrl = document.getElementById('nim-cfg-base-url').value.trim();
        const resultBox = document.getElementById('nim-test-result');

        resultBox.style.display = 'block';
        resultBox.className = 'goscheme-nim-test-result';
        resultBox.textContent = 'Testing connection with NVIDIA NIM microservice... ⏳';

        try {
          const res = await fetch('http://localhost:5000/api/chatbot/test-nim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key, model, baseUrl })
          });
          const data = await res.json();
          if (data && data.success) {
            resultBox.className = 'goscheme-nim-test-result success';
            resultBox.textContent = `✅ Connected! Latency: ${data.latencyMs}ms | Status: Online`;
          } else {
            resultBox.className = 'goscheme-nim-test-result error';
            resultBox.textContent = `❌ Test Failed: ${data?.message || 'Connection error'}`;
          }
        } catch (e) {
          resultBox.className = 'goscheme-nim-test-result error';
          resultBox.textContent = `❌ Test Failed: Could not reach backend test endpoint (${e.message})`;
        }
      });
    }
  }

  // Public Interface for Page Integrations
  window.GoSchemeChatbot = {
    open: function () {
      const windowElem = document.getElementById('goscheme-chatbot-window');
      const launcher = document.getElementById('goscheme-chatbot-launcher');
      chatbotState.isOpen = true;
      if (windowElem) windowElem.classList.add('active');
      if (launcher) launcher.style.display = 'none';
    },
    close: function () {
      const windowElem = document.getElementById('goscheme-chatbot-window');
      const launcher = document.getElementById('goscheme-chatbot-launcher');
      chatbotState.isOpen = false;
      if (windowElem) windowElem.classList.remove('active');
      if (launcher) launcher.style.display = 'flex';
    },
    analyzeScheme: function (schemeId, schemeTitle) {
      chatbotState.currentSchemeId = schemeId;
      chatbotState.currentSchemeTitle = schemeTitle;
      this.open();
      checkActiveScheme();
      handleSendMessage(`Analyze the scheme "${schemeTitle || schemeId}" in detail for my fed profile.`);
    }
  };

  // Auto-init on DOMContentLoaded
  function init() {
    loadNimConfig();
    loadUserProfile();
    mountChatbotUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

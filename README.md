# 🏛️ GoScheme — Government Schemes Discovery & Eligibility Platform

**GoScheme** is an end-to-end web platform and REST API microservice designed to help Indian citizens—particularly in Tamil Nadu—discover eligible Central and State Government welfare schemes based on personalized demographic criteria (age, gender, income, qualification, district, and caste category).

---

## 🚀 Features

- 🎯 **5-Factor Server-Side Eligibility Engine**: Matches citizen profile parameters against active government scheme rules to compute real-time match percentages (`100% Match`, `80% Match`) and key eligibility criteria tags.
- 🔍 **Interactive Scheme Explorer**: Search and filter government schemes by level (*Tamil Nadu* vs *Central*), category (*Women & Education*, *Healthcare*, *Scholarships*, *Agriculture*, etc.), and live search query.
- 📋 **Multi-Step Profile Setup Wizard**: Step-by-step citizen onboarding to capture essential demographic data.
- 🔖 **Bookmark & Saved Schemes Sync**: Allows citizens to save schemes for quick retrieval, synced to SQLite database.
- 🔔 **Notification Center**: Real-time notification updates regarding new schemes, upcoming application deadlines, and profile refresh status.
- ⚙️ **Admin Portal**: Dashboard for administrators to track platform metrics, toggle scheme status (*Active/Inactive*), add new schemes, or remove deprecated schemes.

---

## 🛠 Technology Stack

### Backend Service (`/backend`)
- **Runtime**: Node.js (`>= v18.0.0`)
- **Framework**: Express.js
- **Database**: SQLite (via `sql.js` WASM engine — 100% self-contained, 0 native build dependencies)
- **Security**: JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS
- **Port**: `5000`

### Frontend Application (`/`)
- **Core**: HTML5, Vanilla JavaScript (ES6+ async/await)
- **Design System**: Vanilla CSS3 with custom properties, glassmorphism, responsive grid layout, and custom typography

---

## 📁 Repository Structure

```text
goscheme/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js   # SQLite connection, DDL table initialization & query helpers
│   │   │   └── seed.js       # Seed script with schemes, notifications & default users
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT validation & admin authorization middleware
│   │   ├── routes/
│   │   │   ├── auth.js       # Auth (register, login, profile CRUD)
│   │   │   ├── schemes.js    # Schemes listing & eligibility engine
│   │   │   ├── saved.js      # Bookmarked schemes API
│   │   │   ├── notifications.js # Notifications API
│   │   │   └── admin.js      # Admin dashboard metrics & scheme CRUD
│   │   └── server.js         # Express app entrypoint
│   ├── database.sqlite       # Relational SQLite DB file (auto-created)
│   └── package.json
├── css/                      # Stylesheets & CSS design system tokens
├── js/
│   ├── app.js                # Global API client, toast notifications & nav header state
│   ├── auth.js               # Login & Registration handlers
│   ├── profile.js            # Profile wizard & editing handlers
│   ├── schemes.js            # Explore, Eligible & Details page handlers
│   ├── admin.js              # Admin portal handlers
│   └── notifications.js      # Notification center page handlers
├── index.html                # Landing page
├── dashboard.html            # Main Citizen Dashboard
├── explore-schemes.html      # Schemes Directory
├── eligible-schemes.html     # Personalized Matched Schemes
├── saved-schemes.html        # Bookmarked Schemes
├── scheme-details.html       # Single Scheme Detailed View
├── profile-setup.html        # Wizard Profile Setup
├── notifications.html        # Notification Center
├── login.html / register.html# Auth pages
└── .gitignore
```

---

## ⚙️ Quickstart Setup Guide

### 1. Prerequisites
Ensure you have **Node.js** (`>= 18.0.0`) and **npm** installed on your system.

```bash
node -v
npm -v
```

### 2. Install Backend Dependencies
Navigate to the `backend` directory and install dependencies:

```bash
cd backend
npm install
```

### 3. Run the Backend API Server
Start the server (this automatically initializes the SQLite schema and seeds initial data):

```bash
npm start
# OR for development watching:
npm run dev
```

The backend server will start at:
👉 **Health Check**: `http://localhost:5000/api/health`

### 4. Serve the Frontend Web Application
You can serve the root directory using any static web server (e.g. `npx serve .`, Live Server extension in VS Code, or Python `python3 -m http.server 8000`).

```bash
# In project root directory:
npx serve .
```

Open `http://localhost:3000` (or local static server URL) in your browser.

---

## 🗄 Database Schema DDL Reference

The backend uses a relational SQLite database schema.

### `users` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Unique user ID |
| `email` | TEXT UNIQUE NOT NULL | Email address |
| `password_hash` | TEXT NOT NULL | Bcrypt hashed password |
| `full_name` | TEXT NOT NULL | Citizen full name |
| `phone` | TEXT | Mobile phone number |
| `dob` | DATE | Date of Birth |
| `gender` | TEXT | Female / Male / Other |
| `caste` | TEXT | BC / SC / ST / MBC / SCC / General |
| `state` | TEXT | State residency (default: 'Tamil Nadu') |
| `district` | TEXT | Resident district |
| `area` | TEXT | Urban / Rural |
| `income` | INTEGER | Annual Household Income in INR |
| `occupation` | TEXT | Student / Farmer / Self-Employed / Unemployed / Homemaker |
| `education` | TEXT | Primary School / High School / Diploma / ITI / Undergraduate / Postgraduate / Ph.D |
| `ration_card` | TEXT | Rice Card / Sugar Card / No Card |
| `is_profile_complete` | INTEGER | `1` if profile wizard completed, `0` if pending |
| `role` | TEXT | `'user'` or `'admin'` |

### `schemes` Table
| Column | Type | Description |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Scheme code (e.g., `TN-001`) |
| `title` | TEXT NOT NULL | Scheme name |
| `department` | TEXT NOT NULL | Government department |
| `level` | TEXT NOT NULL | `Tamil Nadu` or `Central` |
| `category` | TEXT NOT NULL | Sector category |
| `min_age` / `max_age` | INTEGER | Age bounds |
| `gender` | TEXT | Eligible gender (`All`, `Female`, `Male`) |
| `income_cap` | INTEGER | Maximum annual income cap |
| `education` | TEXT | JSON array of eligible education levels |
| `occupation` | TEXT | JSON array of eligible occupations |
| `benefits` | TEXT | Financial and social grant description |
| `application_deadline` | DATE | Target expiry date |
| `official_url` | TEXT | Government portal application link |
| `documents` | TEXT | JSON array of required documents |
| `status` | TEXT | `Active` or `Inactive` |

---

## 🔑 Default Seed Credentials

For quick testing and evaluation, the backend database is pre-seeded with two accounts:

### 👤 Citizen Account
- **Email**: `ananya.sundaram@example.com`
- **Password**: `password123`
- **Role**: `user`

### 🔑 Admin Account
- **Email**: `admin@goscheme.gov.in`
- **Password**: `admin123`
- **Role**: `admin`

---

## 🌐 REST API Documentation

### 🔑 Authentication Endpoints
- `POST /api/auth/register` — Create new user account.
- `POST /api/auth/login` — Login user or admin, returns JWT token.
- `GET /api/auth/me` — Fetch authenticated user details (*Requires Bearer Token*).
- `PUT /api/auth/profile` — Update user demographic profile (*Requires Bearer Token*).

### 🏛 Scheme & Eligibility Endpoints
- `GET /api/schemes` — Fetch all schemes (Query params: `level`, `category`, `search`, `status`).
- `GET /api/schemes/eligible` — Dynamic server-side eligibility match calculation for authenticated user (*Requires Bearer Token*).
- `GET /api/schemes/:id` — Fetch scheme details by ID.

### 🔖 Saved Schemes Endpoints
- `GET /api/saved-schemes` — Fetch user's bookmarked schemes (*Requires Bearer Token*).
- `POST /api/saved-schemes/toggle` — Bookmark or unbookmark scheme by ID (*Requires Bearer Token*).

### 🤖 Automated Scraper Endpoints
- `GET /api/scraper/status` — Get background scheduler status, cron expression, and last execution summary.
- `POST /api/scraper/trigger` — Trigger immediate live scraper crawl across Tamil Nadu & central portals.
- `GET /api/scraper/logs` — Fetch chronological execution history and synchronization statistics.

### 🔄 Scraper CLI Command
```bash
cd backend
npm run scrape
```

---

## 📄 License
This project is open-source under the [ISC License](file:///home/vsp/Documents/sanjai's%20proj/goscheme/backend/package.json).

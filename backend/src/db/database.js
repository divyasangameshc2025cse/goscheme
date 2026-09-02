const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database.sqlite');

let dbInstance = null;

async function getDbInstance() {
  if (dbInstance) return dbInstance;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(filebuffer);
  } else {
    dbInstance = new SQL.Database();
  }
  return dbInstance;
}

function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper Promise wrappers for SQLite queries
async function runAsync(sql, params = []) {
  const db = await getDbInstance();
  db.run(sql, params);
  const res = db.exec("SELECT last_insert_rowid() as id, changes() as changes;");
  const lastID = res[0]?.values[0]?.[0] || 0;
  const changes = res[0]?.values[0]?.[1] || 0;
  saveDb();
  return { id: lastID, changes };
}

async function getAsync(sql, params = []) {
  const db = await getDbInstance();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

async function allAsync(sql, params = []) {
  const db = await getDbInstance();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Database Schema Initialization (DDL)
async function initDatabaseSchema() {
  const db = await getDbInstance();

  // 1. Users table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      dob DATE,
      gender TEXT DEFAULT 'Female',
      caste TEXT DEFAULT 'BC',
      state TEXT DEFAULT 'Tamil Nadu',
      district TEXT DEFAULT 'Chennai',
      area TEXT DEFAULT 'Urban',
      income INTEGER DEFAULT 180000,
      occupation TEXT DEFAULT 'Student',
      education TEXT DEFAULT 'Undergraduate',
      ration_card TEXT DEFAULT 'Rice Card',
      disability_status TEXT DEFAULT 'No',
      first_gen_graduate TEXT DEFAULT 'Yes',
      govt_school_studied TEXT DEFAULT 'Yes',
      is_profile_complete INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Schemes table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      min_age INTEGER DEFAULT 0,
      max_age INTEGER DEFAULT 100,
      gender TEXT DEFAULT 'All',
      income_cap INTEGER DEFAULT 9999999,
      education TEXT NOT NULL,
      occupation TEXT NOT NULL,
      caste_category TEXT NOT NULL,
      district_eligibility TEXT DEFAULT 'All Tamil Nadu Districts',
      benefits TEXT NOT NULL,
      application_deadline DATE NOT NULL,
      official_url TEXT NOT NULL,
      description TEXT NOT NULL,
      documents TEXT NOT NULL,
      is_new INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Saved Schemes table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS saved_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scheme_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE,
      UNIQUE(user_id, scheme_id)
    );
  `);

  // 4. Notifications table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id INTEGER NULLABLE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT DEFAULT 'Just now',
      type TEXT DEFAULT 'system',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 5. Applications table
  await runAsync(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scheme_id TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      remarks TEXT,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE
    );
  `);

  saveDb();
  console.log('Database schema initialized successfully (SQLite WASM).');
}

module.exports = {
  getDbInstance,
  runAsync,
  getAsync,
  allAsync,
  initDatabaseSchema,
  saveDb
};

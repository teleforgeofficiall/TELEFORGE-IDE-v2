import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';

let _db = null;

export async function initDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  const dbPath = config.databasePath;
  const dir = dirname(dbPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  runSchema();
  persistDb();
  return _db;
}

export function getDb() {
  return _db;
}

export function persistDb() {
  if (_db) {
    const data = _db.export();
    writeFileSync(config.databasePath, Buffer.from(data));
  }
}

function runSchema() {
  _db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    credits INTEGER DEFAULT 50, plan TEXT DEFAULT 'free',
    api_key TEXT DEFAULT '', razorpay_subscription_id TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add is_admin column if missing (for existing DBs)
  try {
    _db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0");
  } catch (e) { /* column already exists */ }

  _db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    model TEXT DEFAULT 'claude-opus-4-7', title TEXT DEFAULT 'New Session',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  _db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL,
    role TEXT NOT NULL, content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  )`);

  _db.run(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    razorpay_payment_id TEXT, razorpay_subscription_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  _db.run(`CREATE TABLE IF NOT EXISTS user_files (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    path TEXT NOT NULL, content TEXT DEFAULT '',
    type TEXT DEFAULT 'file',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, path)
  )`);
}

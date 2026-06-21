import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, persistDb } from '../db/index.js';
import { config } from '../config.js';

export function registerUser(email, username, password) {
  const db = getDb();

  const existingStmt = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?');
  existingStmt.bind([email, username]);
  if (existingStmt.step()) {
    throw new Error('Email or username already exists');
  }

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO users (id, email, username, password_hash, credits) VALUES (?, ?, ?, ?, ?)',
    [id, email, username, passwordHash, config.freeCredits]);
  persistDb();

  const token = jwt.sign({ userId: id }, config.jwtSecret, { expiresIn: '7d' });

  return {
    token,
    user: { id, email, username, credits: config.freeCredits, plan: 'free' }
  };
}

export function loginUser(email, password) {
  const db = getDb();

  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  stmt.bind([email]);
  if (!stmt.step()) {
    throw new Error('Invalid email or password');
  }
  const user = stmt.getAsObject();

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      credits: user.credits,
      plan: user.plan,
      api_key: user.api_key || ''
    }
  };
}

export function getUserData(userId) {
  const db = getDb();
  const stmt = db.prepare('SELECT id, email, username, credits, plan, api_key, created_at FROM users WHERE id = ?');
  stmt.bind([userId]);
  if (!stmt.step()) throw new Error('User not found');
  return stmt.getAsObject();
}

export function updateApiKey(userId, apiKey) {
  const db = getDb();
  db.run('UPDATE users SET api_key = ? WHERE id = ?', [apiKey, userId]);
  persistDb();
  return { api_key: apiKey };
}

export function upgradeToPro(userId, subscriptionId) {
  const db = getDb();
  db.run('UPDATE users SET plan = ?, credits = 999999, razorpay_subscription_id = ? WHERE id = ?',
    ['pro', subscriptionId, userId]);
  persistDb();
}

export function getUserCredits(userId) {
  const db = getDb();
  const stmt = db.prepare('SELECT credits, plan FROM users WHERE id = ?');
  stmt.bind([userId]);
  if (!stmt.step()) throw new Error('User not found');
  return stmt.getAsObject();
}

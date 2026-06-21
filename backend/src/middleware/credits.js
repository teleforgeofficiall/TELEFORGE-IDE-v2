import { getDb, persistDb } from '../db/index.js';

export function deductCredit(userId) {
  const db = getDb();
  db.run('UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0', [userId]);
  persistDb();
}

export function checkCredits(userId) {
  const db = getDb();
  const stmt = db.prepare('SELECT credits, plan FROM users WHERE id = ?');
  stmt.bind([userId]);
  if (!stmt.step()) return { credits: 0, plan: 'free' };
  return stmt.getAsObject();
}

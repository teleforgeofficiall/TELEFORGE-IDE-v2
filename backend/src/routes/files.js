import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { getDb, persistDb } from '../db/index.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT id, path, type, updated_at FROM user_files WHERE user_id = ? ORDER BY path'
  );
  stmt.bind([req.userId]);
  const files = [];
  while (stmt.step()) {
    files.push(stmt.getAsObject());
  }
  res.json({ files });
});

router.post('/write', authMiddleware, (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const db = getDb();
    const existingStmt = db.prepare('SELECT id FROM user_files WHERE user_id = ? AND path = ?');
    existingStmt.bind([req.userId, filePath]);

    if (existingStmt.step()) {
      const existing = existingStmt.getAsObject();
      db.run('UPDATE user_files SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content || '', existing.id]);
    } else {
      db.run('INSERT INTO user_files (id, user_id, path, content, type) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), req.userId, filePath, content || '', 'file']);
    }
    persistDb();
    res.json({ success: true, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/read', authMiddleware, (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM user_files WHERE user_id = ? AND path = ?');
  stmt.bind([req.userId, req.query.path]);
  if (!stmt.step()) {
    return res.status(404).json({ error: 'File not found' });
  }
  const file = stmt.getAsObject();
  res.json({ content: file.content, path: file.path });
});

router.delete('/delete', authMiddleware, (req, res) => {
  const db = getDb();
  db.run('DELETE FROM user_files WHERE user_id = ? AND path = ?', [req.userId, req.query.path]);
  persistDb();
  res.json({ success: true });
});

router.post('/mkdir', authMiddleware, (req, res) => {
  const db = getDb();
  const { path: dirPath } = req.body;

  const existingStmt = db.prepare('SELECT id FROM user_files WHERE user_id = ? AND path = ?');
  existingStmt.bind([req.userId, dirPath]);

  if (!existingStmt.step()) {
    db.run('INSERT INTO user_files (id, user_id, path, type, content) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), req.userId, dirPath, 'folder', '']);
    persistDb();
  }

  res.json({ success: true });
});

export default router;

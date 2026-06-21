import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { checkCredits, deductCredit } from '../middleware/credits.js';
import { callFreeModel, getAvailableModels } from '../services/freemodel.js';
import { getDb, persistDb } from '../db/index.js';

const router = Router();

router.get('/models', (req, res) => {
  res.json({ models: getAvailableModels() });
});

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, model = 'claude-sonnet-4-6', sessionId } = req.body;
    const db = getDb();

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const credits = checkCredits(req.userId);

    if (credits.plan !== 'pro' && credits.credits <= 0) {
      return res.status(403).json({
        error: 'insufficient_credits',
        message: 'You have no credits remaining. Please buy a plan to continue.',
        code: 'NO_CREDITS'
      });
    }

    const userStmt = db.prepare('SELECT id, api_key, plan, credits FROM users WHERE id = ?');
    userStmt.bind([req.userId]);
    if (!userStmt.step()) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userStmt.getAsObject();
    const apiKey = user.api_key;

    let sid = sessionId;
    if (!sid) {
      sid = uuidv4();
      db.run('INSERT INTO sessions (id, user_id, model, title) VALUES (?, ?, ?, ?)',
        [sid, req.userId, model, message.substring(0, 50)]);
      persistDb();
    }

    db.run('INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [uuidv4(), sid, 'user', message]);
    persistDb();

    // Strategy:
    // 1. If user has own API key → direct FreeModel API call
    // 2. If user has no API key but has credits → use shared VPS Claude Code CLI
    // 3. If user is Pro with no API key → also use CLI
    let useCLI = false;
    if (!apiKey) {
      useCLI = true;
    }

    const result = await callFreeModel(model, [{ role: 'user', content: message }], apiKey, useCLI);

    deductCredit(req.userId);

    db.run('INSERT INTO messages (id, session_id, role, content, tokens_used) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), sid, 'assistant', result.content, result.tokens.output]);
    persistDb();

    res.json({
      sessionId: sid,
      content: result.content,
      tokens: result.tokens,
      model: result.model,
    });
  } catch (err) {
    if (err.status) {
      res.status(err.status).json({
        error: err.code,
        message: err.message,
      });
    } else {
      console.error('AI chat error:', err);
      res.status(500).json({
        error: 'api_error',
        message: err.message || 'An unexpected error occurred',
      });
    }
  }
});

router.get('/sessions', authMiddleware, (req, res) => {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT id, model, title, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC'
  );
  stmt.bind([req.userId]);
  const sessions = [];
  while (stmt.step()) {
    sessions.push(stmt.getAsObject());
  }
  res.json({ sessions });
});

router.get('/sessions/:id/messages', authMiddleware, (req, res) => {
  const db = getDb();

  const sessionStmt = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?');
  sessionStmt.bind([req.params.id, req.userId]);
  if (!sessionStmt.step()) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const msgStmt = db.prepare(
    'SELECT role, content, tokens_used, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC'
  );
  msgStmt.bind([req.params.id]);
  const messages = [];
  while (msgStmt.step()) {
    messages.push(msgStmt.getAsObject());
  }

  res.json({ messages });
});

export default router;

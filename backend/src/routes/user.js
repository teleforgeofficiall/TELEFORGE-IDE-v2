import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUserData, updateApiKey, getUserCredits } from '../services/auth.js';

const router = Router();

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = getUserData(req.userId);
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.put('/api-key', authMiddleware, (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    const result = updateApiKey(req.userId, apiKey);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/credits', authMiddleware, (req, res) => {
  try {
    const user = getUserCredits(req.userId);
    res.json({ credits: user.credits, plan: user.plan });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;

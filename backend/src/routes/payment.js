import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { getDb, persistDb } from '../db/index.js';
import { createSubscription, verifyPayment } from '../services/razorpay.js';
import { upgradeToPro } from '../services/auth.js';
import { config } from '../config.js';

const router = Router();

router.post('/create-subscription', authMiddleware, async (req, res) => {
  try {
    const result = await createSubscription();
    const db = getDb();
    db.run('INSERT INTO payments (id, user_id, amount, status, razorpay_subscription_id) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), req.userId, config.proPrice, 'pending', result.subscriptionId]);
    persistDb();
    res.json(result);
  } catch (err) {
    console.error('Subscription creation failed:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

router.post('/verify', authMiddleware, (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    const isValid = verifyPayment(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature
    );

    if (isValid) {
      const db = getDb();
      upgradeToPro(req.userId, razorpay_subscription_id);
      db.run('UPDATE payments SET status = ?, razorpay_payment_id = ? WHERE razorpay_subscription_id = ?',
        ['success', razorpay_payment_id, razorpay_subscription_id]);
      persistDb();
      res.json({ verified: true, plan: 'pro' });
    } else {
      res.status(400).json({ verified: false, error: 'Invalid signature' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

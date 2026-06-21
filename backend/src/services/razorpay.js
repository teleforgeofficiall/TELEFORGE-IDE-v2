import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config.js';

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpayInstance;
}

export async function createSubscription() {
  const razorpay = getRazorpay();

  const subscription = await razorpay.subscriptions.create({
    plan_id: 'plan_299_monthly',
    total_count: 12,
    quantity: 1,
    customer_notify: true,
  });

  return {
    subscriptionId: subscription.id,
    keyId: config.razorpay.keyId,
  };
}

export function verifyPayment(paymentId, subscriptionId, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${subscriptionId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
}

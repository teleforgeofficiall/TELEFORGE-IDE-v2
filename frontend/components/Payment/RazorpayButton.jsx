'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { createSubscription, verifyPayment } from '@/lib/auth';
import { CreditCard, Loader2 } from 'lucide-react';

export default function RazorpayButton({ userId, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { subscriptionId, keyId } = await createSubscription();

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'FreeCode AI',
        description: 'Pro Plan - ₹299/month',
        image: '/logo.png',
        handler: async function (response) {
          try {
            const result = await verifyPayment(
              response.razorpay_payment_id,
              response.razorpay_subscription_id,
              response.razorpay_signature
            );
            if (result.verified) {
              toast.success('Welcome to Pro! Unlimited AI requests unlocked.');
              if (onSuccess) onSuccess();
            }
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: { color: '#ec4899' },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Failed to start payment');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <CreditCard className="w-5 h-5" />
      )}
      {loading ? 'Processing...' : 'Upgrade to Pro - ₹299/month'}
    </button>
  );
}

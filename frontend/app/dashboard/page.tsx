'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useStore from '@/lib/store';
import { getMe, getCredits } from '@/lib/auth';
import { Terminal, CreditCard, Zap, Code2, LogOut, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, logout } = useStore();
  const [credits, setCredits] = useState({ credits: 0, plan: 'free' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await getMe();
      const creditsData = await getCredits();
      setUser(userData);
      setCredits(creditsData);
    } catch (err) {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Navbar */}
      <nav className="border-b border-[#2a2a4a] bg-[#0f0f1a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-pink-500" />
            <span className="text-xl font-bold text-white">FreeCode<span className="text-pink-500">AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button onClick={() => logout()} className="text-gray-400 hover:text-pink-400 transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Credits Card */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {user?.username || 'Developer'}!
              </h1>
              <p className="text-gray-400 mb-6">Ready to build something amazing?</p>

              <div className="flex items-center gap-8">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Zap className="w-4 h-4 text-pink-400" />
                    Credits
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {credits.plan === 'pro' ? '∞' : credits.credits}
                    <span className="text-sm text-gray-400 font-normal"> / 50</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Plan
                  </div>
                  <div className="text-xl font-semibold text-white capitalize">
                    {credits.plan === 'pro' ? '✨ Pro' : 'Free'}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/ide')}
              className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition text-lg flex items-center gap-2"
            >
              <Code2 className="w-5 h-5" />
              Open IDE
            </button>
          </div>
        </div>

        {/* Upgrade Card */}
        {credits.plan !== 'pro' && (
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Upgrade to Pro</h2>
                <p className="text-gray-400">
                  Get unlimited AI requests, premium models, and priority support for just ₹299/month.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard?upgrade=true')}
                className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {[
            { title: 'Recent Projects', desc: 'Continue where you left off', icon: Code2, color: 'from-pink-500 to-rose-600' },
            { title: 'API Settings', desc: 'Configure your API keys', icon: Terminal, color: 'from-purple-500 to-violet-600' },
            { title: 'Billing', desc: 'Manage your subscription', icon: CreditCard, color: 'from-cyan-500 to-blue-600' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6 hover:border-pink-500/50 transition cursor-pointer"
              onClick={() => router.push('/ide')}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} p-2 mb-4`}>
                <item.icon className="w-full h-full" />
              </div>
              <h3 className="text-white font-semibold mb-1">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Code2, CreditCard, Sparkles, ArrowRight, Brain, Lock, Github } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/ide');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Navbar */}
      <nav className="border-b border-[#2a2a4a] bg-[#0f0f1a]/80 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-8 h-8 text-pink-500" />
            <span className="text-2xl font-bold text-white">FreeCode<span className="text-pink-500">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="text-gray-300 hover:text-white px-4 py-2 transition"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-pink-400 text-sm font-medium">Powered by Claude & GPT</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-white">Code with the </span>
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Power of AI
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            A full-featured code editor with AI-powered assistance. Write code, run commands,
            and get help from the most advanced AI models — all in your browser.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
            >
              Start Coding Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="border border-[#2a2a4a] text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:border-pink-500/50 transition"
            >
              Sign In
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              5 free credits (50 requests) — No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-[#2a2a4a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Everything you need in one <span className="text-pink-400">editor</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Code2 className="w-8 h-8" />,
                title: 'VS Code-like Editor',
                desc: 'Monaco-powered code editor with syntax highlighting, multi-tab support, and file management.',
                color: 'from-pink-500 to-rose-600',
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: 'Multi-Model AI Chat',
                desc: 'Switch between Claude Opus, Sonnet, GPT-5.5, and more. Bring your own API key.',
                color: 'from-purple-500 to-violet-600',
              },
              {
                icon: <Terminal className="w-8 h-8" />,
                title: 'Built-in Terminal',
                desc: 'Full terminal emulator with real shell access. Run code, install packages, and more.',
                color: 'from-cyan-500 to-blue-600',
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: 'Credit System',
                desc: 'Start with 5 free credits. Upgrade to Pro for unlimited access at ₹299/month.',
                color: 'from-emerald-500 to-green-600',
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: 'AI Code Generation',
                desc: 'Ask AI to write code, explain concepts, debug issues, or suggest improvements.',
                color: 'from-amber-500 to-orange-600',
              },
              {
                icon: <Github className="w-8 h-8" />,
                title: 'File Management',
                desc: 'Full file explorer with create, edit, delete, and folder support for your projects.',
                color: 'from-pink-500 to-rose-600',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-8 hover:border-pink-500/50 transition group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-5 group-hover:scale-110 transition`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 border-t border-[#2a2a4a]" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Simple, transparent <span className="text-pink-400">pricing</span>
          </h2>
          <p className="text-gray-400 text-center mb-16 text-lg">
            Start free, upgrade when you need more
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-gray-400 mb-6">Perfect for getting started</p>
              <div className="text-4xl font-bold text-white mb-8">
                ₹0
                <span className="text-lg text-gray-500 font-normal">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <Sparkles className="w-4 h-4 text-pink-400" /> 5 credits (50 requests)
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Code2 className="w-4 h-4 text-pink-400" /> Full code editor
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Terminal className="w-4 h-4 text-pink-400" /> Terminal access
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Brain className="w-4 h-4 text-pink-400" /> Basic models
                </li>
              </ul>
              <button
                onClick={() => router.push('/register')}
                className="w-full border border-[#2a2a4a] text-gray-300 py-3 rounded-xl font-semibold hover:border-pink-500/50 transition"
              >
                Get Started
              </button>
            </div>

            <div className="bg-gradient-to-b from-pink-500/10 to-transparent border border-pink-500/30 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 mt-2">Pro</h3>
              <p className="text-gray-400 mb-6">For serious developers</p>
              <div className="text-4xl font-bold text-white mb-8">
                ₹299
                <span className="text-lg text-gray-500 font-normal">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <Sparkles className="w-4 h-4 text-pink-400" /> Unlimited requests
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Code2 className="w-4 h-4 text-pink-400" /> Full code editor
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Terminal className="w-4 h-4 text-pink-400" /> Terminal access
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Brain className="w-4 h-4 text-pink-400" /> All models including premium
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Lock className="w-4 h-4 text-pink-400" /> Priority support
                </li>
              </ul>
              <button
                onClick={() => router.push('/register')}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a4a] py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-gray-500 text-sm">
          <span>&copy; 2026 FreeCode AI. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span>Powered by FreeModel API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

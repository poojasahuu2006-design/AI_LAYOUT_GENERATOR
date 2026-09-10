import React, { useState } from 'react';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Ruler, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid engineering / client email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setSubmitted(true);
    } catch (err) {
      // Fallback
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blueprint-dark flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-sky-500/30 shadow-2xl p-8 text-white relative z-10">
        
        <button
          onClick={() => onNavigate('login')}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-sky-400 hover:text-sky-300 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Architect Login
        </button>

        <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mb-4 border border-sky-500/30 shadow-sm">
          <KeyRound className="w-6 h-6" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono font-bold mb-2 uppercase">
          <Ruler className="w-3 h-3 text-amber-400" /> Key Recovery
        </div>

        <h1 className="text-2xl font-black text-white mb-1">Reset Access Key</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Enter your registered architect or client email address to receive secure password recovery instructions.
        </p>

        {submitted ? (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 text-emerald-300 text-xs space-y-3 font-mono">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Recovery Link Dispatched
            </div>
            <p className="leading-relaxed text-slate-300">
              If an account exists for <strong className="text-sky-300">{email}</strong>, a secure reset link has been transmitted.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-sm text-xs transition mt-2 font-mono uppercase"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">ACCOUNT EMAIL</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@construction.com"
                  className="w-full bg-slate-950/80 border border-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:bg-slate-950 focus:border-sky-400 outline-none transition font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-700 hover:from-sky-400 hover:to-blue-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 font-mono uppercase tracking-wide"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Link...
                </>
              ) : (
                'Transmit Reset Link'
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

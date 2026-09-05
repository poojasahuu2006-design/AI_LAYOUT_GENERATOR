import React, { useState } from 'react';
import { Home, User, Mail, Lock, UserPlus, CheckCircle, AlertCircle, RefreshCw, Layers, Box } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignUpPage({ onNavigate }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(name, email, password, confirmPassword);
      onNavigate('home');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-architect-grid-light">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* LEFT COLUMN: ARCHITECTURAL VISUAL & BRANDING */}
        <div className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>
          
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-sky-400 border border-white/20">
                <Home className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">AI House Planner</span>
            </div>

            <h2 className="text-3xl font-black leading-tight mb-4 text-white">
              Create your free account
            </h2>
            <p className="text-xs text-sky-100/80 leading-relaxed mb-6">
              Unlock full access to AI floor plan generator, Ground + First floor blueprints, 3D interactive models, and your private saved project library.
            </p>
          </div>

          {/* Architectural Feature Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-sky-200 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Full AI Building Generator & 3D Viewer</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-sky-200 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Isolated Private Project Library</span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-[11px] text-sky-200/60 font-mono">
            Free account for personal building design
          </div>
        </div>

        {/* RIGHT COLUMN: SIGN UP FORM */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create your account ✨</h1>
            <p className="text-xs text-slate-500">Enter your details to get started with AI House Planner.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pooja Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pooja@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="font-extrabold text-sky-600 hover:text-sky-700 ml-1"
            >
              Sign In
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

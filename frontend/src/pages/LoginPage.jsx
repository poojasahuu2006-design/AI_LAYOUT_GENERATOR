import React, { useState } from 'react';
import { Home, Mail, Lock, LogIn, CheckCircle, AlertCircle, RefreshCw, Layers, Box } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      onNavigate('home');
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('exist')) {
        setError('Account not found. Please create an account.');
      } else {
        setError('Incorrect email or password.');
      }
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
              Design your dream home with AI.
            </h2>
            <p className="text-xs text-sky-100/80 leading-relaxed mb-6">
              Generate intelligent Ground + First Floor 2D and 3D building layouts from your requirements.
            </p>
          </div>

          {/* Architectural Layout Graphic Preview */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-sky-200">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> 2D Architectural Grid</span>
              <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> 3D Model</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-white/10 border border-white/20 rounded p-2 text-center">
                <div className="font-bold text-white">Ground Floor</div>
                <div className="text-sky-200">Living • Kitchen • Bath</div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded p-2 text-center">
                <div className="font-bold text-white">First Floor</div>
                <div className="text-sky-200">Bedrooms • Balcony</div>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="pt-6 border-t border-white/10 text-[11px] text-sky-200/60 font-mono flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Account Access Required</span>
          </div>
        </div>

        {/* RIGHT COLUMN: SIGN IN FORM */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome Back 👋</h1>
            <p className="text-xs text-slate-500">Sign in to continue to AI House Planner.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none transition"
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
                  <RefreshCw className="w-4 h-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="font-extrabold text-sky-600 hover:text-sky-700 ml-1"
            >
              Create Account
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

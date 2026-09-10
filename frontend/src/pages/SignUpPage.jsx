import React, { useState } from 'react';
import { Home, User, Mail, Lock, UserPlus, CheckCircle, AlertCircle, RefreshCw, Layers, Box, Compass, ShieldCheck, Ruler, Building2, HardHat, FileSpreadsheet } from 'lucide-react';
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
      setError('Please enter your full name or firm name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid engineering email address.');
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
    <div className="min-h-screen bg-blueprint-dark flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* CAD Background Markers */}
      <div className="absolute top-4 left-6 text-[10px] font-mono text-sky-400/40 select-none hidden sm:block">
        SPEC: IS 3861:2002 • NBC 2016 RESIDENTIAL NORMS
      </div>
      <div className="absolute top-4 right-6 text-[10px] font-mono text-sky-400/40 select-none hidden sm:block">
        CIVIL DRAFTING & 3D STUDIO SUITE
      </div>
      <div className="absolute bottom-4 left-6 text-[10px] font-mono text-sky-400/30 select-none hidden sm:block">
        SECURE CLOUD PROJECT VAULT
      </div>

      <div className="max-w-4xl w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-sky-500/30 shadow-2xl shadow-sky-950/80 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
        
        {/* LEFT COLUMN: ARCHITECTURAL FEATURES SHOWCASE */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-sky-500/20">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 border border-sky-300/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white">AI House Planner</span>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                    FREE ACCESS
                  </span>
                </div>
                <p className="text-[11px] text-sky-300/70 font-mono flex items-center gap-1">
                  <HardHat className="w-3 h-3 text-amber-400" /> Architectural & Civil Layout Studio
                </p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-3 text-white">
              Create Your Professional <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-amber-300">
                Architect & Builder Account
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6 font-medium">
              Unlock the full suite of AI 2D CAD drafting, Ground + First Floor blueprints, BOQ civil cost estimator, and 3D textured models.
            </p>
          </div>

          {/* Architectural Feature Checklist */}
          <div className="bg-slate-950/80 border border-sky-500/30 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-200 font-mono font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automatic 100% Space Allocation & Zero Overlaps</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200 font-mono font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bill of Quantities (Cement, Steel, Bricks) Estimator</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200 font-mono font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Vastu Shastra Compass & Door/Window Schedules</span>
            </div>
          </div>

          <div className="pt-5 border-t border-sky-500/20 text-[11px] text-sky-300/70 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Isolated Secure Project Vault
            </span>
            <span className="text-[10px] text-sky-400 font-bold">100% CLOUD SAFE</span>
          </div>
        </div>

        {/* RIGHT COLUMN: SIGN UP FORM */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-slate-900/60 text-white">
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold mb-2 uppercase">
              <Ruler className="w-3 h-3 text-amber-400" /> New Account Registration
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Register Engineer Profile</h1>
            <p className="text-xs text-slate-400 mt-1">Start generating compliant building layouts in seconds.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">FULL NAME / FIRM NAME</label>
              <div className="relative">
                <User className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Er. Pooja Sharma"
                  className="w-full bg-slate-950/80 border border-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:bg-slate-950 focus:border-sky-400 outline-none transition font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">OFFICIAL / CLIENT EMAIL</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@domain.com"
                  className="w-full bg-slate-950/80 border border-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:bg-slate-950 focus:border-sky-400 outline-none transition font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">ACCOUNT PASSWORD</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-950/80 border border-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:bg-slate-950 focus:border-sky-400 outline-none transition font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">CONFIRM PASSWORD</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-950/80 border border-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:bg-slate-950 focus:border-sky-400 outline-none transition font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-700 hover:from-emerald-400 hover:to-sky-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4 tracking-wide uppercase font-mono"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Architect Account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="font-extrabold text-sky-400 hover:text-sky-300 ml-1 underline underline-offset-4"
            >
              Sign In to Studio
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

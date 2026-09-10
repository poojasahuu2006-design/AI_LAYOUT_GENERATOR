import React, { useState } from 'react';
import { Home, Mail, Lock, LogIn, CheckCircle, AlertCircle, RefreshCw, Layers, Box, Compass, ShieldCheck, Ruler, Building2, HardHat, FileText } from 'lucide-react';
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
      setError('Please enter a valid engineering / client email address.');
      return;
    }
    if (!password) {
      setError('Please enter your access password.');
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
        setError('Architect account not found. Please create your account.');
      } else {
        setError('Incorrect email or password credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blueprint-dark flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* CAD Coordinate Markers Background */}
      <div className="absolute top-4 left-6 text-[10px] font-mono text-sky-400/40 select-none hidden sm:block">
        GRID: 30×40 FT • SCALE: 1:100 • DATUM: +0.00M (GROUND LEVEL)
      </div>
      <div className="absolute top-4 right-6 text-[10px] font-mono text-sky-400/40 select-none hidden sm:block">
        CIVIL ENG CAD SUITE v2.6 • NBC 2016 COMPLIANT
      </div>
      <div className="absolute bottom-4 left-6 text-[10px] font-mono text-sky-400/30 select-none hidden sm:block">
        RCC BEAM COLUMNS • STRUCTURAL ZONING • IS 3861:2002
      </div>
      <div className="absolute bottom-4 right-6 text-[10px] font-mono text-sky-400/30 select-none hidden sm:block">
        SECURE ARCHITECTURAL WORKSPACE
      </div>

      <div className="max-w-4xl w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-sky-500/30 shadow-2xl shadow-sky-950/80 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
        
        {/* LEFT COLUMN: ARCHITECTURAL CAD BLUEPRINT SHOWCASE */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-sky-500/20">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>
          
          <div>
            {/* Header Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 border border-sky-300/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white">AI House Planner</span>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded">
                    CAD PRO
                  </span>
                </div>
                <p className="text-[11px] text-sky-300/70 font-mono flex items-center gap-1">
                  <HardHat className="w-3 h-3 text-amber-400" /> Architectural & Civil Layout Studio
                </p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-3 text-white">
              Intelligent Residential <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-amber-300">
                Building & CAD Engine
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6 font-medium">
              Precision 2D blueprint drafting, NBC 2016 multi-floor space allocation, 3D structural walkthroughs, and material BOQ estimation.
            </p>
          </div>

          {/* Interactive Architectural Blueprint Mockup */}
          <div className="bg-slate-950/80 border border-sky-500/30 rounded-2xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-sky-300 pb-2 border-b border-sky-500/20">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-sky-400" /> 2D DUAL BLUEPRINT</span>
              <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-amber-400" /> 3D PBR RENDER</span>
              <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-emerald-400" /> VASTU AUDIT</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-sky-950/50 border border-sky-400/20 rounded-xl p-2.5">
                <div className="flex items-center justify-between text-sky-200 font-bold text-[11px]">
                  <span>Ground Floor</span>
                  <span className="text-[9px] text-sky-400">EL +0.00m</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Living • Kitchen • Dining • Staircase</div>
              </div>
              <div className="bg-sky-950/50 border border-sky-400/20 rounded-xl p-2.5">
                <div className="flex items-center justify-between text-sky-200 font-bold text-[11px]">
                  <span>First Floor</span>
                  <span className="text-[9px] text-amber-400">EL +3.20m</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Master Bed • Lounge • Balcony</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3 h-3" /> 100% Space Utilization
              </span>
              <span className="text-slate-500">IS 3861 / NBC 2016 Compliant</span>
            </div>
          </div>

          {/* Security & Civil Verification Badge */}
          <div className="pt-5 border-t border-sky-500/20 text-[11px] text-sky-300/70 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Encrypted CAD Workspace
            </span>
            <span className="text-[10px] text-amber-400 font-bold">● STUDIO ACTIVE</span>
          </div>
        </div>

        {/* RIGHT COLUMN: ARCHITECT / CLIENT SIGN IN FORM */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-slate-900/60 text-white">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono font-bold mb-2 uppercase">
              <Ruler className="w-3 h-3 text-amber-400" /> Studio Access Portal
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Architect Login</h1>
            <p className="text-xs text-slate-400 mt-1">Enter your credentials to access your building projects.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                ENGINEER / USER EMAIL
              </label>
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 font-mono">
                  SECURITY KEY / PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:bg-slate-950 focus:border-sky-400 outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-700 hover:from-sky-400 hover:to-blue-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4 tracking-wide uppercase font-mono"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Open CAD Studio
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
            New engineer or property owner?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="font-extrabold text-sky-400 hover:text-sky-300 ml-1 underline underline-offset-4"
            >
              Register New Studio Account
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

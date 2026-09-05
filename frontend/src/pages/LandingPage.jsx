import React from 'react';
import { 
  Sparkles, Layers, Box, Mic, Sliders, ArrowRight, 
  Ruler, Home, Cpu, ShieldCheck, CheckCircle2, Zap, Building2, BookOpen, LayoutDashboard, FolderKanban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function LandingPage({ onStartDesigning, onViewDemo, onGoToWorkspace, onGoToSaved }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white font-sans">
      
      {/* HERO SECTION WITH USER WELCOME & BOOK CODE BADGES */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-blueprint-light border-b border-slate-200">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          {/* Welcome User Banner */}
          {user && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 border border-sky-300 text-sky-800 text-xs font-black uppercase tracking-wider shadow-sm mb-6">
              <span>👋 Welcome back, <strong className="text-sky-950">{user.name}</strong>!</span>
            </div>
          )}

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
            AI House Planner <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-700">
              Compliant Architectural Engine
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-600 mb-8 leading-relaxed font-medium">
            Generate 2D and 3D Ground + First Floor building layouts certified under Indian Civil Codes: 
            <strong> NBC 2016 (Vol 1)</strong>, <strong>ECSBC 2024 (BEE)</strong>, and <strong>Maharashtra Co-operative Societies Act 1960</strong>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <button
              onClick={onGoToWorkspace}
              className="px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition text-xs sm:text-sm"
            >
              <Sparkles className="w-4 h-4" /> Open Workspace (2D/3D)
            </button>

            <button
              onClick={onStartDesigning}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition text-xs sm:text-sm"
            >
              <Sparkles className="w-4 h-4 text-sky-400" /> Start New Design
            </button>

            <button
              onClick={onGoToSaved}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm text-xs sm:text-sm"
            >
              <FolderKanban className="w-4 h-4 text-indigo-600" /> View Saved Projects
            </button>
          </div>

          {/* 3 CIVIL & ENERGY CODE COMPLIANCE BADGES (FROM ATTACHED BOOKS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-5xl mx-auto mb-8">
            
            {/* BOOK 1: ECSBC 2024 */}
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-sm hover:border-emerald-500 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">GOVT OF INDIA / BEE</span>
                  <h3 className="text-xs font-black text-slate-900">ECSBC 2024</h3>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium mb-3">
                Energy Conservation & Sustainable Building Code (BEE 2024). Enforces Daylighting WWR (&lt;40%), thermal insulation, and rooftop solar readiness.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> BEE 5-Star Ready
              </span>
            </div>

            {/* BOOK 2: MAHARASHTRA CO-OP SOCIETIES ACT 1960 */}
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm hover:border-indigo-500 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">MAHARASHTRA ACT XXIV</span>
                  <h3 className="text-xs font-black text-slate-900">Co-op Societies Act 1960</h3>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium mb-3">
                Maharashtra Co-operative Societies Housing Bylaws. Enforces FSI / FAR utilization, 15% open space ratio, and parking allocation per tenement.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                <CheckCircle2 className="w-3 h-3 text-indigo-600" /> FSI & Society Bylaws
              </span>
            </div>

            {/* BOOK 3: NBC 2016 VOLUME 1 */}
            <div className="bg-white border-2 border-sky-200 rounded-2xl p-5 shadow-sm hover:border-sky-500 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest block">NATIONAL BUILDING CODE</span>
                  <h3 className="text-xs font-black text-slate-900">NBC 2016 (Volume 1)</h3>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium mb-3">
                National Building Code of India. Enforces structural safety, minimum room sizes (9.5 sq.m), fire egress distance, and 0.45m plinth height.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                <CheckCircle2 className="w-3 h-3 text-sky-600" /> Structural & Fire Safety
              </span>
            </div>

          </div>

          {/* Visual Showcase Card */}
          <div className="relative max-w-5xl mx-auto rounded-3xl p-3 bg-white border border-slate-200 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl overflow-hidden bg-slate-50 p-4">
              
              {/* 2D Plan Visual Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center relative shadow-sm">
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> 2D Dimensioned Plan (IS 962)
                </div>
                <div className="w-full h-56 mt-6 bg-slate-50 border border-slate-300 rounded-lg p-3 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-2 h-full">
                    <div className="border border-sky-400 bg-sky-50/80 p-2 rounded flex flex-col justify-center items-center">
                      <span className="text-xs font-bold text-slate-800">LIVING ROOM</span>
                      <span className="text-[10px] text-sky-700 font-mono">15.5 × 19.2 ft</span>
                    </div>
                    <div className="border border-amber-400 bg-amber-50/80 p-2 rounded flex flex-col justify-center items-center">
                      <span className="text-xs font-bold text-slate-800">KITCHEN</span>
                      <span className="text-[10px] text-amber-700 font-mono">10.0 × 8.0 ft</span>
                    </div>
                    <div className="col-span-2 border border-emerald-400 bg-emerald-50/80 p-2 rounded flex flex-col justify-center items-center">
                      <span className="text-xs font-bold text-slate-800">MAIN ENTRY ROUTE</span>
                      <span className="text-[10px] text-emerald-700 font-mono">NBC 2016 Compliant</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Model Visual Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center relative shadow-sm">
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" /> 3D Interactive Building
                </div>
                <div className="w-full h-56 mt-6 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="w-36 h-36 bg-gradient-to-tr from-sky-400 to-indigo-500 border-2 border-white transform rotate-45 rounded-2xl shadow-xl flex items-center justify-center">
                    <span className="transform -rotate-45 text-xs font-bold text-white uppercase tracking-widest text-center">
                      Ground + First<br />3D Model
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Workflow Engine</h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto">
              From plot dimensions to a full 2D and 3D architectural floor plan in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Enter Your Plot', desc: 'Provide plot length and width in feet or meters.', icon: Ruler },
              { step: '02', title: 'Select Requirements', desc: 'Specify Ground Floor and First Floor room requirements.', icon: Mic },
              { step: '03', title: 'Generate Layout', desc: 'AI solves space constraints with NBC 2016 & ECSBC 2024 compliance.', icon: Cpu },
              { step: '04', title: 'Interactive 3D', desc: 'Explore your house in 2D vector blueprint and 3D orbit viewer.', icon: Layers }
            ].map((s, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl relative hover:border-sky-500 transition saas-card-hover">
                <span className="text-2xl font-black text-slate-300 mb-3 block font-mono">{s.step}</span>
                <s.icon className="w-5 h-5 text-sky-600 mb-2" />
                <h3 className="text-sm font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER FOOTER */}
      <DisclaimerBanner />
    </div>
  );
}

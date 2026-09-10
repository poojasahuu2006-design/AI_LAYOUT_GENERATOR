import React from 'react';
import { X, Compass, CheckCircle2, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import { evaluateVastuCompliance } from '../services/vastuComplianceService';

export default function VastuComplianceModal({ isOpen, onClose, layout }) {
  if (!isOpen) return null;

  const vastu = evaluateVastuCompliance(layout);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Vastu Shastra Directional Audit</h2>
              <p className="text-xs text-slate-400 font-mono">Vastu Purusha Mandala & Directional Energy Alignment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Overall Score Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-teal-300 font-bold">Vastu Compliance Score</div>
              <div className="text-3xl font-black font-mono mt-1 text-white flex items-center gap-2">
                {vastu.overallScore}%
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {vastu.overallScore >= 80 ? 'Highly Auspicious' : 'Moderately Balanced'}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-teal-400 flex items-center justify-center font-mono font-black text-xl text-white shadow-inner bg-teal-950/50">
              {vastu.overallScore}%
            </div>
          </div>

          {/* Compass Orientation Matrix Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              <span>Room Direction Matrix</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {vastu.ratings.map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-start justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{r.name}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-600 rounded">
                        {r.zone}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{r.explanation}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    r.status === 'Optimal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Vastu Guidelines */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
              <Lightbulb className="w-4 h-4 text-teal-600" />
              <span>Architectural Harmony Insights</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
              {vastu.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
}

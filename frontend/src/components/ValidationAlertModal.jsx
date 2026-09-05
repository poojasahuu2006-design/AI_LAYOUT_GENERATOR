import React from 'react';
import { AlertTriangle, Minimize2, Trash2, Maximize2, Sparkles, X } from 'lucide-react';

export default function ValidationAlertModal({ 
  isOpen, 
  onClose, 
  plot, 
  errors = [], 
  onReduceRoomSizes, 
  onRemoveRoom, 
  onIncreasePlotDimensions, 
  onAutoOptimize 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-amber-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Space Constraint Warning</h3>
            <p className="text-xs text-amber-800 font-medium mt-1">
              Your requirements cannot comfortably fit within the available {plot?.width || 30} × {plot?.length || 40} {plot?.unit || 'ft'} space.
            </p>
          </div>
        </div>

        {/* Errors details list */}
        {errors && errors.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs text-slate-700 space-y-1 font-mono">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-rose-600">
                <span className="text-rose-600 font-bold">•</span>
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Try one of these options:</p>

        {/* Action options grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onReduceRoomSizes}
            className="p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-xl text-left transition flex items-start gap-2.5 group"
          >
            <Minimize2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 group-hover:scale-110 transition" />
            <div>
              <div className="text-xs font-bold text-slate-800">Optimize Room Sizes</div>
              <div className="text-[11px] text-slate-500">Scales down room target sizes</div>
            </div>
          </button>

          <button
            onClick={onRemoveRoom}
            className="p-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-400 rounded-xl text-left transition flex items-start gap-2.5 group"
          >
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 group-hover:scale-110 transition" />
            <div>
              <div className="text-xs font-bold text-slate-800">Reduce Room Count</div>
              <div className="text-[11px] text-slate-500">Removes smallest non-essential room</div>
            </div>
          </button>

          <button
            onClick={onIncreasePlotDimensions}
            className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-xl text-left transition flex items-start gap-2.5 group"
          >
            <Maximize2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 group-hover:scale-110 transition" />
            <div>
              <div className="text-xs font-bold text-slate-800">Increase Plot Size</div>
              <div className="text-[11px] text-slate-500">Expands plot dimensions</div>
            </div>
          </button>

          <button
            onClick={onAutoOptimize}
            className="p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-left transition flex items-start gap-2.5 shadow-md"
          >
            <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">Generate Compact</div>
              <div className="text-[11px] text-sky-100">AI auto-fits layout to plot</div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}

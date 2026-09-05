import React from 'react';
import { Home, RefreshCw } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-4 bg-architect-grid-light">
      <div className="flex flex-col items-center justify-center space-y-4 max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-xl shadow-sky-600/30 animate-pulse">
          <Home className="w-8 h-8" />
        </div>
        
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">AI House Planner</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
            Checking your session...
          </p>
        </div>
      </div>
    </div>
  );
}

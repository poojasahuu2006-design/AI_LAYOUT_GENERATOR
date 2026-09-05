import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DisclaimerBanner({ compact = false }) {
  return (
    <div className={`bg-slate-100 border-t border-slate-200 ${compact ? 'py-2 px-4' : 'py-4 px-6'} text-center`}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-600 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="leading-relaxed text-[11px] sm:text-xs text-slate-600">
          <strong className="text-amber-800 font-semibold">Architectural Disclaimer:</strong> This application provides AI-generated conceptual building layouts for planning and visualization purposes. It is not a substitute for professional architectural, structural, electrical, plumbing, fire-safety or local building-code approval. Final construction drawings must be reviewed and approved by qualified professionals and relevant authorities.
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 max-w-md bg-slate-900/95 text-slate-100 border-slate-700">
      <div className="shrink-0">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-rose-400" />
        ) : isInfo ? (
          <Info className="w-5 h-5 text-indigo-400" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        )}
      </div>

      <div className="text-xs sm:text-sm font-medium leading-tight">
        {toast.message}
      </div>

      <button
        onClick={onClose}
        className="ml-auto p-1 rounded-md text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

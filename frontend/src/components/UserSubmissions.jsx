import React from 'react';
import { ExternalLink, Clock, CheckCircle2, XCircle, PlusCircle, Building2 } from 'lucide-react';

export default function UserSubmissions({ 
  submissions, 
  onOpenAddModal, 
  loading 
}) {
  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading your posts...
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Posts Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
          You haven't posted any jobs yet. When you post a job link, it goes to the Admin for approval.
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post a Job</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white">My Posts</h2>
          <p className="text-xs text-slate-400">Track the review status of jobs you've posted</p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Post a Job</span>
        </button>
      </div>

      <div className="grid gap-3">
        {submissions.map((item) => {
          const isPending = item.status === 'pending';
          const isApproved = item.status === 'approved';
          const isRejected = item.status === 'rejected';

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white">{item.name}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.category}
                  </span>
                </div>

                <a
                  href={item.careers_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span className="truncate max-w-sm">{item.careers_url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>

                {item.admin_notes && (
                  <p className="mt-1 text-xs text-rose-300 italic">
                    Admin note: {item.admin_notes}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {isPending && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Under Admin Review</span>
                  </span>
                )}
                {isApproved && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved & Live</span>
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rejected</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

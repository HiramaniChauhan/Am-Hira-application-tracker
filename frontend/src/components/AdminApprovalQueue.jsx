import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  X, 
  User, 
  Calendar, 
  Loader2
} from 'lucide-react';

export default function AdminApprovalQueue({
  pendingList,
  onApprove,
  onReject,
  loading
}) {
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleApprove = async (id, name) => {
    setActionLoadingId(id);
    await onApprove(id, name);
    setActionLoadingId(null);
  };

  const handleRejectConfirm = async (id, name) => {
    setActionLoadingId(id);
    await onReject(id, name, rejectReason);
    setRejectingId(null);
    setRejectReason('');
    setActionLoadingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Moderation Guide Banner */}
      <div className="p-5 rounded-xl bg-[#16171b] border border-[#2a2b33] text-[#cccccc]">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#c5a059]/15 text-[#c5a059] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-brand font-bold text-base text-white tracking-tight">
              Admin Link Moderation Queue
            </h2>
            <p className="text-xs sm:text-sm text-[#999999] leading-relaxed">
              When others submit company links, verify the URL. Clicking <strong className="text-[#c5a059]">"Accept & Publish"</strong> adds it directly to the To Apply list.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Items List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-[#777777]">
          <Loader2 className="w-5 h-5 animate-spin text-[#c5a059] mr-2" />
          <span>Loading pending submissions...</span>
        </div>
      ) : pendingList.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-[#25262c] bg-[#16171b]">
          <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center mx-auto mb-3">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="font-brand font-bold text-base text-white">Queue is Clear</h3>
          <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
            All submitted company links have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingList.map((company) => {
            const isProcessing = actionLoadingId === company.id;
            const isRejecting = rejectingId === company.id;

            return (
              <div
                key={company.id}
                className="p-4 rounded-xl border border-[#282930] bg-[#16171b] hover:border-[#383944] transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-[#c5a059]/20 text-[#c5a059]">
                        Pending Review
                      </span>
                      <h3 className="font-brand font-bold text-base text-white tracking-tight">
                        {company.name}
                      </h3>
                    </div>

                    {/* Careers URL */}
                    <div className="flex items-center gap-2">
                      <a
                        href={company.careers_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-[#a0a0a0] hover:text-[#c5a059] underline inline-flex items-center gap-1 max-w-md truncate"
                        title="Click to test link in new tab"
                      >
                        <span className="truncate">{company.careers_url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>

                    {/* Submitter info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#777777] pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#666666]" />
                        Submitted by: <strong className="text-[#cccccc] font-medium">{company.submitted_by_name || 'User'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#666666]" />
                        {new Date(company.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Right: Validation & Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    {/* Test link button */}
                    <a
                      href={company.careers_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1c1d22] hover:bg-[#24252c] text-[#cccccc] border border-[#2c2d36] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>Test Link</span>
                    </a>

                    {/* Accept button */}
                    <button
                      onClick={() => handleApprove(company.id, company.name)}
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Approve link and publish"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>Accept & Publish</span>
                    </button>

                    {/* Reject button */}
                    <button
                      onClick={() => setRejectingId(isRejecting ? null : company.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1c1d22] hover:bg-rose-950/40 text-[#888888] hover:text-rose-400 border border-[#2c2d36] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Reject submission"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {/* Inline Reject Form */}
                {isRejecting && (
                  <div className="mt-3 pt-3 border-t border-[#25262c] flex flex-col sm:flex-row items-center gap-2 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Optional reason for rejection"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-rose-500"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleRejectConfirm(company.id, company.name)}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => setRejectingId(null)}
                        className="px-2.5 py-1.5 text-xs text-[#777777] hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

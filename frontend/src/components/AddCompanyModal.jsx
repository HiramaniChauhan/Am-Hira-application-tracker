import React, { useState } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  Plus
} from 'lucide-react';
import { api } from '../api';

export default function AddCompanyModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess, 
  onRequireAuth 
}) {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth('Please log in or create an account to post a job.');
      return;
    }

    if (!link.trim()) {
      setError('Please enter a company job link.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.addCompany({
        link: link.trim(),
        careers_url: link.trim()
      });

      onSuccess(response.message, response.isApproved);
      onClose();
      setLink('');
    } catch (err) {
      setError(err.message || 'Failed to post job link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-[#282930] bg-[#16171b] shadow-2xl p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#24252c]">
          <div>
            <h2 className="font-brand font-bold text-xl text-white tracking-tight">Post a Job</h2>
            <p className="text-xs text-[#888888] mt-0.5">Paste any company career or job link to post</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#777777] hover:text-white hover:bg-[#202127] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role & Moderation Info Banner */}
        {user ? (
          user.role === 'admin' ? (
            <div className="my-4 p-3 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/30 text-xs text-[#d8b46e] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#c5a059] mt-0.5" />
              <div>
                <strong className="font-semibold block">Admin Mode:</strong>
                Job will be published directly into the public directory.
              </div>
            </div>
          ) : (
            <div className="my-4 p-3 rounded-lg bg-[#202127] border border-[#2d2e37] text-xs text-[#bbbbbb] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#c5a059] mt-0.5" />
              <div>
                <strong className="font-semibold block text-white">Submitted for Admin Approval:</strong>
                Your job post will be reviewed by the admin before appearing in the public list.
              </div>
            </div>
          )
        ) : (
          <div className="my-4 p-3 rounded-lg bg-[#202127] border border-[#2d2e37] text-xs text-[#aaaaaa] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#777777] mt-0.5" />
            <div>
              <strong className="font-semibold block text-white">Sign In Required:</strong>
              Please sign in to post a job.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form: ONLY ONE FIELD for Link */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#aaaaaa] mb-1.5 uppercase tracking-wider">
              Company Job / Career Link
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                autoFocus
                placeholder="https://jobs.netflix.com or https://company.com/careers"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-[#111215] border border-[#282930] focus:border-[#c5a059] text-white placeholder-[#555555] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-[#888888] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{user?.role === 'admin' ? 'Post Job' : 'Post Job for Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

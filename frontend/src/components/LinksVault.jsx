import React, { useState, useEffect, useMemo } from 'react';
import {
  Link as LinkIcon,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Bookmark,
  Briefcase,
  FileText,
  Code2,
  Layers,
  MousePointerClick,
  LogIn,
  Loader2,
  Database,
  X
} from 'lucide-react';
import { api } from '../api';

const CATEGORIES = [
  'All',
  'Job Post',
  'Application Portal',
  'Resume & Docs',
  'Portfolio',
  'Interview Prep',
  'Company Site',
  'Other'
];

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'done', label: 'Done / Offered' },
  { value: 'archived', label: 'Archived' }
];

export default function LinksVault({ user, onRequireAuth, showToast }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Job Post');
  const [formStatus, setFormStatus] = useState('saved');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Copied indicator state
  const [copiedId, setCopiedId] = useState(null);

  const fetchLinks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getLinks({
        search,
        category: selectedCategory,
        status: selectedStatus
      });
      setLinks(data.links || []);
    } catch (err) {
      console.error('Fetch links error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user, search, selectedCategory, selectedStatus]);

  const handleOpenAddModal = () => {
    if (!user) {
      onRequireAuth('Please log in to store your personal links in SQLite.');
      return;
    }
    setEditingLink(null);
    setFormUrl('');
    setFormTitle('');
    setFormCategory('Job Post');
    setFormStatus('saved');
    setFormNotes('');
    setFormTags('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (link) => {
    setEditingLink(link);
    setFormUrl(link.url);
    setFormTitle(link.title);
    setFormCategory(link.category || 'Job Post');
    setFormStatus(link.status || 'saved');
    setFormNotes(link.notes || '');
    setFormTags(link.tags || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formUrl.trim()) {
      setFormError('Please enter a link URL.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingLink) {
        await api.updateLink(editingLink.id, {
          url: formUrl.trim(),
          title: formTitle.trim(),
          category: formCategory,
          status: formStatus,
          notes: formNotes.trim(),
          tags: formTags.trim()
        });
        showToast('Link updated in SQLite database!', 'success');
      } else {
        await api.addLink({
          url: formUrl.trim(),
          title: formTitle.trim(),
          category: formCategory,
          status: formStatus,
          notes: formNotes.trim(),
          tags: formTags.trim()
        });
        showToast('Link stored in SQLite Links Vault!', 'success');
      }

      setIsModalOpen(false);
      fetchLinks();
    } catch (err) {
      setFormError(err.message || 'Failed to save link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete link "${title}" from SQLite database?`)) return;
    try {
      await api.deleteLink(id);
      showToast(`Link "${title}" deleted.`, 'info');
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      showToast(err.message || 'Failed to delete link', 'error');
    }
  };

  const handleCopy = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('Link copied to clipboard!', 'info');
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleLinkClick = (id) => {
    api.trackLinkClick(id).catch(() => {});
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, clicks: (l.clicks || 0) + 1 } : l))
    );
  };

  // Compute category stats
  const stats = useMemo(() => {
    return {
      total: links.length,
      jobPosts: links.filter((l) => l.category === 'Job Post').length,
      portals: links.filter((l) => l.category === 'Application Portal').length,
      resumeDocs: links.filter((l) => l.category === 'Resume & Docs' || l.category === 'Portfolio').length,
      prep: links.filter((l) => l.category === 'Interview Prep').length
    };
  }, [links]);

  if (!user) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
          <Database className="w-8 h-8" />
        </div>
        <h3 className="font-brand font-bold text-xl text-white mb-2">
          Private SQLite Links Data Vault
        </h3>
        <p className="text-xs text-[#888888] leading-relaxed mb-6">
          Store and organize your direct job links, application URLs, resume links, portfolio showcases, and interview preparation materials — persisted in your local SQLite database.
        </p>
        <button
          onClick={() => onRequireAuth('Please log in or sign up to store and manage your links data.')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to Access Links Vault</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner / Stats Header */}
      <div className="p-4 rounded-xl bg-[#15161b] border border-[#23242b] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#c5a059]" />
            <h3 className="font-brand font-bold text-base text-white">
              Links Vault
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30">
              {stats.total} Links
            </span>
          </div>
          <p className="text-[11px] text-[#777777] mt-0.5">
            Your personal cloud-backed links library for job posts, career portals, portfolios, and docs.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Store New Link</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search links by title, url, tags, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs rounded-lg bg-[#121316] border border-[#23242b] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
          />
        </div>

        {/* Categories Badges with horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer border shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#c5a059] text-[#101114] border-[#c5a059]'
                  : 'bg-[#141519] text-[#888888] hover:text-white border-[#23242b] hover:border-[#353642]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Links List */}
      {loading ? (
        <div className="py-12 text-center text-[#777777] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#c5a059]" />
          <span className="text-xs">Loading links from SQLite...</span>
        </div>
      ) : links.length === 0 ? (
        <div className="py-12 px-4 rounded-xl border border-dashed border-[#282932] text-center bg-[#131418]">
          <Bookmark className="w-8 h-8 text-[#555555] mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">No links found</h4>
          <p className="text-xs text-[#777777] max-w-sm mx-auto mb-4">
            {search || selectedCategory !== 'All'
              ? 'No stored links match your current search and category filter.'
              : 'You have not added any links to your SQLite Links Vault yet.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#c5a059] text-[#101114] hover:bg-[#d8b46e] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Store a Link Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const isCopied = copiedId === link.id;

            let catColor = 'bg-[#22242c] text-[#a0a5b5] border-[#30333e]';
            if (link.category === 'Job Post') catColor = 'bg-blue-950/40 text-blue-300 border-blue-800/40';
            else if (link.category === 'Application Portal') catColor = 'bg-purple-950/40 text-purple-300 border-purple-800/40';
            else if (link.category === 'Resume & Docs' || link.category === 'Portfolio') catColor = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
            else if (link.category === 'Interview Prep') catColor = 'bg-amber-950/40 text-amber-300 border-amber-800/40';

            let statusBadge = 'bg-[#18191d] text-[#888888]';
            if (link.status === 'applied') statusBadge = 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40';
            else if (link.status === 'interviewing') statusBadge = 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40';
            else if (link.status === 'done') statusBadge = 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/40';

            return (
              <div
                key={link.id}
                className="py-2.5 px-3.5 sm:px-4 rounded-xl border border-[#23242b] bg-[#15161b] hover:bg-[#181920] hover:border-[#30323e] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-brand font-bold text-xs sm:text-sm text-white tracking-tight truncate">
                      {link.title}
                    </span>

                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${catColor}`}>
                      {link.category}
                    </span>

                    <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase rounded-md ${statusBadge}`}>
                      {link.status}
                    </span>

                    {(link.clicks > 0) && (
                      <span className="text-[10px] text-[#777777] flex items-center gap-0.5 font-mono">
                        <MousePointerClick className="w-2.5 h-2.5" />
                        <span>{link.clicks} clicks</span>
                      </span>
                    )}
                  </div>

                  {/* URL */}
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(link.id)}
                      className="inline-flex items-center gap-1 text-xs text-[#888888] hover:text-[#c5a059] hover:underline font-mono truncate max-w-[220px] xs:max-w-xs sm:max-w-md lg:max-w-xl transition-colors"
                      title={link.url}
                    >
                      <span className="truncate">{link.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  {/* Notes / Tags if present */}
                  {(link.notes || link.tags) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#999999]">
                      {link.notes && (
                        <span className="bg-[#101114] px-2 py-0.5 rounded border border-[#202127] italic">
                          "{link.notes}"
                        </span>
                      )}
                      {link.tags && (
                        <span className="text-[#666666]">
                          Tags: {link.tags}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Copy Link */}
                  <button
                    onClick={() => handleCopy(link.id, link.url)}
                    className="p-1.5 rounded-lg bg-[#18191d] hover:bg-[#202127] border border-[#272832] text-[#888888] hover:text-white transition-colors cursor-pointer"
                    title="Copy URL"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Open Link */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick(link.id)}
                    className="p-1.5 rounded-lg bg-[#18191d] hover:bg-[#202127] border border-[#272832] text-[#888888] hover:text-[#c5a059] transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditModal(link)}
                    className="p-1.5 rounded-lg bg-[#18191d] hover:bg-[#202127] border border-[#272832] text-[#888888] hover:text-[#d8b46e] transition-colors cursor-pointer"
                    title="Edit details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(link.id, link.title)}
                    className="p-1.5 rounded-lg bg-[#18191d] hover:bg-rose-950/40 border border-[#272832] hover:border-rose-900 text-[#777777] hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#282930] bg-[#16171b] shadow-2xl p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-[#777777] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="font-brand font-bold text-lg text-white">
                {editingLink ? 'Edit Stored Link' : 'Store Link in SQLite'}
              </h3>
              <p className="text-xs text-[#888888]">
                Save job posts, career portals, portfolios, or prep resources.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Link URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://company.com/job/123 or https://..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Title / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Google Senior Frontend Role"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white outline-none focus:border-[#c5a059]"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white outline-none focus:border-[#c5a059]"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Notes / Referral Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Referral by recruiter on LinkedIn, submitted tailored resume v2..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="React, Remote, High CTC, Referrals"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#18191d] text-[#888888] hover:text-white border border-[#272832] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingLink ? 'Update Link' : 'Save to SQLite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

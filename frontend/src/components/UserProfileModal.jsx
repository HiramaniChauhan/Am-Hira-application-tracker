import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Briefcase,
  MapPin,
  Phone,
  FileText,
  Globe,
  Code2,
  Link2,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';

export default function UserProfileModal({ isOpen, onClose, user, onUserUpdated, showToast }) {
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' or 'security'
  
  // Profile Form State
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Populate state whenever user or modal changes
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setHeadline(user.headline || '');
      setPhone(user.phone || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      setResumeUrl(user.resume_url || '');
      setPortfolioUrl(user.portfolio_url || '');
      setGithubUrl(user.github_url || '');
      setLinkedinUrl(user.linkedin_url || '');
      setError('');
      setSuccessMsg('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.updateProfile({
        name,
        headline,
        phone,
        location,
        bio,
        resume_url: resumeUrl,
        portfolio_url: portfolioUrl,
        github_url: githubUrl,
        linkedin_url: linkedinUrl
      });

      setSuccessMsg('User data successfully saved to SQLite database!');
      if (onUserUpdated) onUserUpdated(res.user);
      if (showToast) showToast('User profile updated in SQLite!', 'success');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setSuccessMsg(res.message || 'Password successfully updated in SQLite database!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (showToast) showToast('Password changed successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#282930] bg-[#16171b] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#23242b] flex items-center justify-between shrink-0 bg-[#121316]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-sm font-bold text-[#c5a059]">
              {name ? name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-brand font-bold text-lg text-white">User Data & Profile</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                  user.role === 'admin' 
                    ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40' 
                    : 'bg-[#252630] text-[#a0a0b0]'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-[#888888] flex items-center gap-1.5 mt-0.5">
                <Database className="w-3 h-3 text-[#c5a059]" />
                <span>Stored in SQLite Database (`backend/data/easyjob.db`)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#777777] hover:text-white hover:bg-[#202128] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Switcher Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-[#202127] flex items-center gap-4 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => { setActiveSection('profile'); setError(''); setSuccessMsg(''); }}
            className={`pb-2.5 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeSection === 'profile'
                ? 'border-[#c5a059] text-[#c5a059]'
                : 'border-transparent text-[#777777] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Links Data</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSection('security'); setError(''); setSuccessMsg(''); }}
            className={`pb-2.5 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeSection === 'security'
                ? 'border-[#c5a059] text-[#c5a059]'
                : 'border-transparent text-[#777777] hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-3 shrink-0">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {activeSection === 'profile' ? (
            <form onSubmit={handleSaveProfile} id="profile-form" className="space-y-4">
              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Hiramani Chauhan"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#141519] border border-[#23242b] text-[#777777] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Headline */}
              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Professional Headline / Role</label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Full Stack Developer | React, Node.js & Python"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Row 3: Phone & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bengaluru, India / Remote"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Bio */}
              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">About / Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short summary about your background, target companies, or experience..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059] resize-none"
                />
              </div>

              {/* Section Header: User's Links Data */}
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c5a059] block mb-2">
                  🔗 User Links Data (Stored in SQLite)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Resume URL */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] mb-1 flex items-center justify-between">
                      <span>Resume / CV URL</span>
                      {resumeUrl && (
                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#c5a059] hover:underline flex items-center gap-0.5">
                          <span>View</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        placeholder="https://drive.google.com/... or Notion link"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  </div>

                  {/* Portfolio URL */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] mb-1 flex items-center justify-between">
                      <span>Portfolio Website URL</span>
                      {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#c5a059] hover:underline flex items-center gap-0.5">
                          <span>View</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://yourportfolio.dev"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  </div>

                  {/* GitHub Profile */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] mb-1 flex items-center justify-between">
                      <span>GitHub Profile URL</span>
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#c5a059] hover:underline flex items-center gap-0.5">
                          <span>View</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <div className="relative">
                      <Code2 className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  </div>

                  {/* LinkedIn Profile */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] mb-1 flex items-center justify-between">
                      <span>LinkedIn Profile URL</span>
                      {linkedinUrl && (
                        <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#c5a059] hover:underline flex items-center gap-0.5">
                          <span>View</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <div className="relative">
                      <Link2 className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} id="password-form" className="space-y-4 max-w-md mx-auto py-2">
              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Current Password *</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">New Password (min 4 chars) *</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Confirm New Password *</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#23242b] flex items-center justify-between shrink-0 bg-[#121316]">
          <span className="text-[11px] text-[#777777] hidden sm:inline">
            All user data is safely preserved in SQLite `backend/data/easyjob.db`
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1c1d22] hover:bg-[#25262e] text-[#aaaaaa] hover:text-white border border-[#282930] transition-colors cursor-pointer"
            >
              Close
            </button>

            {activeSection === 'profile' ? (
              <button
                type="submit"
                form="profile-form"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save User Data</span>
              </button>
            ) : (
              <button
                type="submit"
                form="password-form"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Update Password</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

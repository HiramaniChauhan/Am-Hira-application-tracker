import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  User, 
  AlertCircle, 
  Loader2,
  Lock,
  Mail,
  Database
} from 'lucide-react';
import { api } from '../api';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialMode = 'login',
  initialMessage 
}) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setError('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let data;
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (password.length < 4) throw new Error('Password must be at least 4 characters');
        data = await api.register(name.trim(), email.trim(), password);
        onSuccess(data.user, `Account created successfully! Welcome, ${data.user.name}.`);
      } else {
        data = await api.login(email.trim(), password);
        onSuccess(data.user, `Welcome back, ${data.user.name}!`);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-[#282930] bg-[#16171b] shadow-2xl p-5 sm:p-7">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-[#777777] hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <h2 className="font-brand font-extrabold text-2xl text-white tracking-tight">
            {mode === 'register' ? 'Create an Account' : 'Sign in to Am hira.'}
          </h2>
          <p className="text-xs text-[#888888] mt-1">
            {mode === 'register'
              ? 'Register with your name & email to organize your job applications'
              : 'Enter your credentials to access your saved applications and stages'}
          </p>
        </div>

        {/* Switcher Tabs: Sign In / Create Account */}
        <div className="grid grid-cols-2 p-1 mb-5 rounded-xl bg-[#101114] border border-[#23242b]">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-[#c5a059] text-[#101114] shadow-sm font-bold'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-[#c5a059] text-[#101114] shadow-sm font-bold'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {initialMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/30 text-xs text-[#d8b46e] flex items-center gap-2">
            <span>{initialMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Hiramani Chauhan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#111215] border border-[#282930] text-white placeholder-[#555555] outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 text-xs font-semibold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Database indicator */}
        <div className="mt-5 pt-4 border-t border-[#222329] flex items-center justify-between text-[11px] text-[#777777]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>SQLite Database Login</span>
          </div>
          <span className="text-[#555555]">• Secure & Encrypted (bcrypt)</span>
        </div>
      </div>
    </div>
  );
}

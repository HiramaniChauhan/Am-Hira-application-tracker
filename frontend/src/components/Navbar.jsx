import {
  Plus,
  ShieldCheck,
  LogIn,
  UserPlus,
  LogOut,
  User
} from 'lucide-react';

export default function Navbar({
  user,
  pendingCount,
  onOpenAddModal,
  onOpenAuthModal,
  onOpenProfileModal,
  onLogout,
  activeTab,
  setActiveTab
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#202126] bg-[#101114]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand: Aer-inspired bold wordmark */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="font-brand font-extrabold text-2xl sm:text-3xl tracking-tight text-white select-none">
              am hira<span className="text-[#c5a059]">.</span>
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#888888] font-medium">
              hi buddy...
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Post a Job button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            title="Post a Job"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Post a Job</span>
          </button>

          {/* User state & Auth (Sign In / Sign Up) */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#27282e]">
              {/* Admin pending badge button */}
              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${activeTab === 'approvals'
                    ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#e0c48e]'
                    : 'bg-[#18191d] border-[#282930] text-[#a0a0a0] hover:text-white hover:border-[#383942]'
                    }`}
                  title="Admin Moderation Queue"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span className="hidden md:inline">Review Links</span>
                  {pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#c5a059] text-black">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              {/* User profile capsule with click to open User Profile modal */}
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18191d] hover:bg-[#202127] border border-[#282930] hover:border-[#3d3e4c] text-[#eeeeee] transition-all cursor-pointer text-left group"
                title="View & Edit User Data in SQLite"
              >
                <div className="w-6 h-6 rounded-md bg-[#25262c] group-hover:bg-[#c5a059] flex items-center justify-center text-xs font-bold text-[#c5a059] group-hover:text-black transition-colors">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight flex items-center gap-1">
                    {user.name}
                    {user.role === 'admin' && (
                      <span className="px-1 text-[9px] font-bold uppercase rounded bg-[#c5a059]/20 text-[#c5a059]">
                        Admin
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-[#777777] group-hover:text-[#c5a059] transition-colors flex items-center gap-1">
                    <span>User Data</span>
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 text-[#777777] hover:text-rose-400 rounded-lg hover:bg-[#1f2026] transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-[#27282e]">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#18191d] hover:bg-[#202127] text-[#eeeeee] border border-[#282930] hover:border-[#383944] transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/25 text-[#d8b46e] border border-[#c5a059]/40 hover:border-[#c5a059] transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import TabNav from './components/TabNav';
import CompanyCard from './components/CompanyCard';
import AddCompanyModal from './components/AddCompanyModal';
import AdminApprovalQueue from './components/AdminApprovalQueue';
import UserSubmissions from './components/UserSubmissions';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import LinksVault from './components/LinksVault';
import Toast from './components/Toast';
import { api, authStorage } from './api';
import {
  Plus,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(authStorage.getUser());
  const [activeTab, setActiveTab] = useState('to_apply'); // 'to_apply', 'applied', 'interviewed', 'links_vault', 'approvals', 'submissions'
  const [companies, setCompanies] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    toApplyCount: 0,
    appliedCount: 0,
    interviewingCount: 0,
    pendingApprovalsCount: 0,
    linksCount: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Multi-select for Admin Bulk Delete
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);

  // Pagination & Page Size State (10, 50, 100)
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Toast
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Reset page & selection when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCompanyIds([]);
    setIsSelectMode(false);
  }, [activeTab, searchQuery]);

  // Load user session on mount
  useEffect(() => {
    if (authStorage.getToken()) {
      api.getMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          authStorage.clearToken();
          authStorage.clearUser();
          setUser(null);
        });
    }
  }, []);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const compRes = await api.getCompanies({
        search: searchQuery
      });
      const allApproved = compRes.companies || [];
      setCompanies(allApproved);

      if (user) {
        const statsRes = await api.getStats().catch(() => ({}));
        const linksStatsRes = await api.getLinksStats().catch(() => ({ totalLinks: 0 }));
        setStats({
          totalCompanies: allApproved.length,
          toApplyCount: statsRes.toApplyCount !== undefined ? statsRes.toApplyCount : allApproved.filter(c => !c.is_applied && !c.is_interviewed).length,
          appliedCount: statsRes.appliedCount || allApproved.filter(c => c.is_applied).length,
          interviewingCount: statsRes.interviewingCount || allApproved.filter(c => c.is_interviewed).length,
          pendingApprovalsCount: statsRes.pendingApprovalsCount || 0,
          linksCount: linksStatsRes?.totalLinks || 0
        });

        if (user.role === 'admin') {
          const pendingRes = await api.getPendingCompanies().catch(() => ({ pending: [] }));
          setPendingList(pendingRes.pending || []);
        }

        const mySubRes = await api.getMySubmissions().catch(() => ({ submissions: [] }));
        setMySubmissions(mySubRes.submissions || []);
      } else {
        const toApply = allApproved.filter(c => !c.is_applied && !c.is_interviewed).length;
        setStats({
          totalCompanies: allApproved.length,
          toApplyCount: toApply,
          appliedCount: 0,
          interviewingCount: 0,
          pendingApprovalsCount: 0,
          linksCount: 0
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, searchQuery]);

  // Auth Handlers
  const handleAuthSuccess = (userData, message) => {
    setUser(userData);
    showToast(message || `Logged in as ${userData.name}!`);
    fetchData();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    if (activeTab === 'approvals' || activeTab === 'submissions') {
      setActiveTab('to_apply');
    }
    showToast('Logged out successfully.', 'info');
    fetchData();
  };

  const handleRequireAuth = (message) => {
    setAuthMode('login');
    setAuthPromptMessage(message || 'Please log in to track your applications.');
    setIsAuthModalOpen(true);
  };

  // CHECKBOX 1: Toggle Applied
  const handleToggleApplied = async (companyId, isApplied) => {
    try {
      const res = await api.toggleApplied(companyId, isApplied);
      showToast(res.message);

      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id === companyId) {
            return {
              ...c,
              is_applied: isApplied,
              applied_date: isApplied ? new Date().toISOString() : c.applied_date,
              app_status: isApplied ? (c.is_interviewed ? 'interviewing' : 'applied') : (c.is_interviewed ? 'interviewing' : 'to_apply')
            };
          }
          return c;
        })
      );

      const statsRes = await api.getStats().catch(() => null);
      if (statsRes) setStats((prev) => ({ ...prev, ...statsRes }));
    } catch (err) {
      showToast(err.message || 'Failed to update applied status', 'error');
    }
  };

  // CHECKBOX 2: Toggle Interviewed
  const handleToggleInterviewed = async (companyId, isInterviewed) => {
    try {
      const res = await api.toggleInterviewed(companyId, isInterviewed);
      showToast(res.message);

      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id === companyId) {
            return {
              ...c,
              is_interviewed: isInterviewed,
              is_applied: isInterviewed ? true : c.is_applied,
              interview_date: isInterviewed ? new Date().toISOString() : c.interview_date,
              interview_stage: isInterviewed ? 'Initial Screening' : c.interview_stage,
              app_status: isInterviewed ? 'interviewing' : (c.is_applied ? 'applied' : 'to_apply')
            };
          }
          return c;
        })
      );

      const statsRes = await api.getStats().catch(() => null);
      if (statsRes) setStats((prev) => ({ ...prev, ...statsRes }));
    } catch (err) {
      showToast(err.message || 'Failed to update interview status', 'error');
    }
  };

  // Save to "To Apply"
  const handleSaveToApply = async (companyId) => {
    try {
      const res = await api.saveToApply(companyId);
      showToast(res.message);
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, app_status: 'to_apply' } : c))
      );
      const statsRes = await api.getStats().catch(() => null);
      if (statsRes) setStats((prev) => ({ ...prev, ...statsRes }));
    } catch (err) {
      showToast(err.message || 'Failed to save to apply', 'error');
    }
  };

  // Admin delete company
  const handleDeleteCompany = async (companyId, companyName) => {
    if (!window.confirm(`Are you sure you want to delete "${companyName}" from the list?`)) {
      return;
    }
    try {
      await api.deleteCompany(companyId);
      showToast(`Removed "${companyName}".`);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete company', 'error');
    }
  };

  // Multi-select for Admin Bulk Delete
  const handleToggleSelect = (id) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedCompanyIds.length === 0) return;
    const count = selectedCompanyIds.length;
    if (
      !window.confirm(
        `Are you sure you want to delete ${count} ${
          count === 1 ? 'company' : 'companies'
        } from the SQLite database?`
      )
    ) {
      return;
    }

    try {
      const res = await api.bulkDeleteCompanies(selectedCompanyIds);
      showToast(res.message || `Deleted ${count} companies from SQLite database.`);
      setSelectedCompanyIds([]);
      setIsSelectMode(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to bulk delete companies', 'error');
    }
  };

  // Admin Approvals
  const handleApprovePending = async (companyId, companyName) => {
    try {
      await api.approveCompany(companyId);
      showToast(`Approved "${companyName}"! Added to To Apply.`);
      fetchData();
      setActiveTab('to_apply');
    } catch (err) {
      showToast(err.message || 'Failed to approve', 'error');
    }
  };

  const handleRejectPending = async (companyId, companyName, reason) => {
    try {
      await api.rejectCompany(companyId, reason);
      showToast(`Rejected submission for "${companyName}".`, 'info');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to reject', 'error');
    }
  };

  // Filter companies: whatever is added goes directly to "to_apply"
  const displayedCompanies = useMemo(() => {
    if (activeTab === 'applied') {
      return companies.filter((c) => c.is_applied);
    }
    if (activeTab === 'interviewed') {
      return companies.filter((c) => c.is_interviewed);
    }
    return companies.filter((c) => !c.is_applied && !c.is_interviewed);
  }, [companies, activeTab]);

  // Pagination calculation
  const totalItems = displayedCompanies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCompanies = useMemo(() => {
    return displayedCompanies.slice(startIndex, startIndex + pageSize);
  }, [displayedCompanies, startIndex, pageSize]);

  // Generate 1, 2, 3, 4 ... page numbers
  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [totalPages, safeCurrentPage]);

  return (
    <div className="min-h-screen bg-[#101114] text-[#eeeeee] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        pendingCount={stats.pendingApprovalsCount}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAuthModal={(mode = 'login') => {
          setAuthMode(mode);
          setAuthPromptMessage('');
          setIsAuthModalOpen(true);
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8">
        {/* Tab & Search Navigation */}
        <TabNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          user={user}
          stats={stats}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'approvals' && user?.role === 'admin' ? (
          <AdminApprovalQueue
            pendingList={pendingList}
            onApprove={handleApprovePending}
            onReject={handleRejectPending}
            loading={loading}
          />
        ) : activeTab === 'submissions' && user ? (
          <UserSubmissions
            submissions={mySubmissions}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            loading={loading}
          />
        ) : activeTab === 'links_vault' ? (
          <LinksVault
            user={user}
            onRequireAuth={handleRequireAuth}
            showToast={showToast}
          />
        ) : (
          /* Companies List for 'to_apply', 'applied', 'interviewed' */
          <div>
            {/* Header for active section */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-brand font-bold text-base sm:text-lg text-white tracking-tight">
                  {activeTab === 'to_apply' && 'To Apply'}
                  {activeTab === 'applied' && 'My Applications'}
                  {activeTab === 'interviewed' && 'Interviewed'}
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-[#1e1f25] text-[#aaaaaa]">
                  {displayedCompanies.length}
                </span>
              </div>

              {/* Admin Multi-Select Action Bar (Admin Only) */}
              {user && user.role === 'admin' && displayedCompanies.length > 0 && (
                <div className="flex items-center gap-2">
                  {!isSelectMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectMode(true);
                        setSelectedCompanyIds([]);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#18191d] hover:bg-[#22232a] border border-[#2e2f38] text-[#c5a059] hover:text-[#d8b46e] transition-colors cursor-pointer shadow-sm"
                      title="Select multiple companies to delete"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Select</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 animate-in fade-in duration-150">
                      <span className="text-xs text-[#c5a059] font-bold bg-[#c5a059]/15 px-2.5 py-1 rounded-md border border-[#c5a059]/30">
                        {selectedCompanyIds.length} Selected
                      </span>

                      {selectedCompanyIds.length > 0 && (
                        <button
                          type="button"
                          onClick={handleBulkDelete}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 hover:border-rose-700 transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Delete selected companies from SQLite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Selected ({selectedCompanyIds.length})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectMode(false);
                          setSelectedCompanyIds([]);
                        }}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#18191d] hover:bg-[#222329] text-[#888888] hover:text-white border border-[#2b2c36] transition-colors cursor-pointer"
                        title="Cancel selection"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-20 text-center text-[#777777] flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading links...</span>
              </div>
            ) : displayedCompanies.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-[#22232a] bg-[#15161a]">
                <div className="w-10 h-10 rounded-xl bg-[#202127] text-[#666666] flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="font-brand font-bold text-base text-white">
                  {activeTab === 'to_apply' && 'No Companies in To Apply'}
                  {activeTab === 'applied' && 'No Applications Marked Yet'}
                  {activeTab === 'interviewed' && 'No Interviews Marked Yet'}
                </h3>
                <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto mb-4">
                  {activeTab === 'to_apply' && 'Click "+ Post a Job" to paste a new job link.'}
                  {activeTab === 'applied' && 'Check the "Applied" box on any company link in To Apply once you have submitted.'}
                  {activeTab === 'interviewed' && 'Check the "Interviewed" box on any company link when you are in process.'}
                </p>

                {activeTab === 'to_apply' && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#c5a059] hover:bg-[#d8b46e] text-[#101114] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Post a Job</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {paginatedCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    user={user}
                    isSelectMode={isSelectMode}
                    isSelected={selectedCompanyIds.includes(company.id)}
                    onToggleSelect={handleToggleSelect}
                    onToggleApplied={handleToggleApplied}
                    onToggleInterviewed={handleToggleInterviewed}
                    onSaveToApply={handleSaveToApply}
                    onDeleteCompany={handleDeleteCompany}
                    onRequireAuth={handleRequireAuth}
                  />
                ))}
              </div>
            )}

            {/* Bottom Controls: Page Size Selector [10, 50, 100] & 1, 2, 3, 4 Pagination */}
            {!loading && totalItems > 0 && (
              <div className="mt-5 pt-3 border-t border-[#1e1f25] flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Left: Box to show 10, 50, 100 list at a time */}
                <div className="flex items-center gap-2 text-xs text-[#888888]">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 text-xs rounded-md bg-[#16171b] border border-[#2a2b34] text-[#eeeeee] outline-none focus:border-[#c5a059] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per page</span>
                  <span className="text-[#555555] ml-2 hidden sm:inline">
                    (Showing {Math.min(startIndex + 1, totalItems)}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems})
                  </span>
                </div>

                {/* Right: 1, 2, 3, 4 ..... Pagination */}
                <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-end">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={safeCurrentPage === 1}
                    className="p-1.5 rounded-md border border-[#24252c] bg-[#16171b] text-[#888888] hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {pageNumbers.map((p, idx) => (
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-1.5 text-xs text-[#555555] select-none">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold transition-all cursor-pointer ${safeCurrentPage === p
                            ? 'bg-[#c5a059] text-[#101114] font-bold shadow-sm'
                            : 'border border-[#24252c] bg-[#16171b] text-[#888888] hover:text-white hover:border-[#383944]'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={safeCurrentPage === totalPages}
                    className="p-1.5 rounded-md border border-[#24252c] bg-[#16171b] text-[#888888] hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1e1f24] bg-[#0d0e10] py-6 text-center text-xs text-[#666666]">
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-brand font-semibold text-[#888888]">Am hira.</span>
          <div className="flex items-center gap-4 text-[#666666]">
            <span>Turso Cloud SQLite</span>
            <span>•</span>
            <span>Minimalist Pipeline</span>
          </div>
        </div>
      </footer>

      {/* Modals & Alerts */}
      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        user={user}
        onSuccess={(msg, isApproved) => {
          showToast(msg);
          fetchData();
          if (isApproved) {
            setActiveTab('to_apply');
          } else {
            setActiveTab('submissions');
          }
        }}
        onRequireAuth={handleRequireAuth}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
        initialMessage={authPromptMessage}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
        }}
        showToast={showToast}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

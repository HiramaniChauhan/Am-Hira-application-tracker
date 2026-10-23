import React from 'react';
import {
  Clock,
  CheckCircle2,
  CalendarCheck,
  ShieldCheck,
  FileText,
  Search,
  Link as LinkIcon
} from 'lucide-react';

export default function TabNav({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  user,
  stats
}) {
  const tabs = [
    { id: 'to_apply', label: 'To Apply', icon: Clock, count: stats.toApplyCount },
    { id: 'applied', label: 'My Applications', icon: CheckCircle2, count: stats.appliedCount },
    { id: 'interviewed', label: 'Interviewed', icon: CalendarCheck, count: stats.interviewingCount },
    { id: 'links_vault', label: 'Links Vault', icon: LinkIcon, count: stats.linksCount },
  ];

  if (user) {
    tabs.push({ id: 'submissions', label: 'My Posts', icon: FileText });
  }

  if (user && user.role === 'admin') {
    tabs.push({
      id: 'approvals',
      label: 'Post Approvals',
      icon: ShieldCheck,
      count: stats.pendingApprovalsCount,
      badgeColor: 'bg-[#c5a059] text-black'
    });
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Clean matte search input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search company or link..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-[#16171b] border border-[#26272e] focus:border-[#c5a059] text-[#eeeeee] placeholder-[#666666] outline-none transition-colors"
        />
      </div>

      {/* Main Tabs bar with Aer-style warm gold active indicator */}
      <div className="border-b border-[#222329] overflow-x-auto no-scrollbar">
        <nav className="flex space-x-4 pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${isActive
                  ? 'border-[#c5a059] text-white'
                  : 'border-transparent text-[#888888] hover:text-[#cccccc] hover:border-[#33343c]'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c5a059]' : 'text-[#777777]'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${tab.badgeColor || (isActive ? 'bg-[#c5a059]/20 text-[#e0c48e]' : 'bg-[#222329] text-[#888888]')
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

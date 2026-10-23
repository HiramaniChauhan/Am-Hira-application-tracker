import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  CalendarCheck, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function HeroStats({ stats, user, activeTab, setActiveTab }) {
  const cards = [
    {
      id: 'to_apply',
      title: 'To Apply',
      subtitle: 'Companies to fill',
      count: stats.toApplyCount || 0,
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/20',
      activeColor: 'border-amber-500 bg-amber-500/10'
    },
    {
      id: 'applied',
      title: 'My Applications',
      subtitle: 'Form filled / submitted',
      count: stats.appliedCount || 0,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/20',
      activeColor: 'border-emerald-500 bg-emerald-500/10'
    },
    {
      id: 'interviewed',
      title: 'Interviewed',
      subtitle: 'In active interview process',
      count: stats.interviewingCount || 0,
      icon: CalendarCheck,
      color: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/20',
      activeColor: 'border-purple-500 bg-purple-500/10'
    }
  ];

  if (user && user.role === 'admin') {
    cards.push({
      id: 'approvals',
      title: 'Pending Approvals',
      subtitle: 'Links awaiting your check',
      count: stats.pendingApprovalsCount || 0,
      icon: ShieldAlert,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/20',
      activeColor: 'border-rose-500 bg-rose-500/10'
    });
  }

  return (
    <section className="mb-8 pt-4">
      {/* Banner / Instructions */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950 p-6 md:p-8 backdrop-blur-xl mb-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <span>🚀 Smart Job Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Job Links & Application Tracker
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Added company links go straight to <strong className="text-amber-400">To Apply</strong>. When you fill out the application form, check <strong className="text-emerald-400">Applied</strong> to move it to My Applications. Check <strong className="text-purple-400">Interviewed</strong> once you are in process.
            </p>
          </div>

          {!user && (
            <div className="shrink-0 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 max-w-xs">
              <span className="font-semibold text-white block mb-1">👀 Public Guest Mode</span>
              <p className="text-slate-400 mb-2">Anyone can view company links. Log in to track your personal applications and checkboxes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className={`grid gap-3 sm:gap-4 ${user?.role === 'admin' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {cards.map((card) => {
          const Icon = card.icon;
          const isActive = activeTab === card.id;

          return (
            <button
              key={card.id}
              onClick={() => setActiveTab(card.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isActive 
                  ? `${card.activeColor} shadow-lg shadow-black/40 translate-y-[-2px]` 
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <div className={`p-1.5 rounded-lg border bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {card.count}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{card.subtitle}</span>
                {isActive && <ArrowRight className="w-3 h-3 text-indigo-400" />}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

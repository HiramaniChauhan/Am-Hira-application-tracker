import React from 'react';
import {
  ExternalLink,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';

function getCompanyDisplayName(company) {
  if (company.name && company.name !== 'Company' && company.name.trim() !== '') {
    return company.name;
  }
  try {
    const raw = company.careers_url || '';
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    let host = url.hostname.toLowerCase();

    const pathname = url.pathname.split('/').filter(Boolean);
    if ((host.includes('lever.co') || host.includes('greenhouse.io') || host.includes('ashbyhq.com') || host.includes('workable.com')) && pathname.length > 0) {
      const slug = pathname[0];
      return slug.charAt(0).toUpperCase() + slug.slice(1);
    }

    host = host.replace(/^(www\.|jobs\.|careers\.|apply\.|boards\.|workat\.)/i, '');
    const parts = host.split('.');
    if (parts.length > 0 && parts[0]) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  } catch (e) {
    // fallback
  }
  return company.name || 'Company';
}

export default function CompanyCard({
  company,
  user,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onToggleApplied,
  onToggleInterviewed,
  onDeleteCompany,
  onRequireAuth
}) {
  const isApplied = Boolean(company.is_applied);
  const isInterviewed = Boolean(company.is_interviewed);
  const displayName = getCompanyDisplayName(company);

  const handleCardClick = () => {
    if (isSelectMode && user?.role === 'admin' && onToggleSelect) {
      onToggleSelect(company.id);
    }
  };

  const handleAppliedClick = (e) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth('Please log in to track your applied companies in My Applications.');
      return;
    }
    onToggleApplied(company.id, !isApplied);
  };

  const handleInterviewedClick = (e) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth('Please log in to track your interviews in the Interviewed section.');
      return;
    }
    onToggleInterviewed(company.id, !isInterviewed);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-xl border transition-all duration-150 p-2.5 sm:py-2.5 sm:px-4 ${
        isSelectMode ? 'cursor-pointer select-none' : ''
      } ${
        isSelected
          ? 'bg-[#201d14] border-[#c5a059] shadow-md ring-1 ring-[#c5a059]/40'
          : isInterviewed
            ? 'bg-[#191714] border-[#c5a059]/40'
            : isApplied
              ? 'bg-[#141814] border-[#557b55]/40'
              : 'bg-[#15161a] hover:bg-[#1a1b20] border-[#23242a] hover:border-[#30313a]'
      }`}
    >
      {/* Mobile & Desktop responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Left / Top: Select Box, Company Name & Link */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Admin Multi-select Checkbox */}
          {user && user.role === 'admin' && isSelectMode && onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(company.id);
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? 'text-[#c5a059] bg-[#c5a059]/15'
                  : 'text-[#666666] hover:text-[#c5a059] bg-[#1a1b20]'
              }`}
              title={isSelected ? 'Deselect company' : 'Select company'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-[#c5a059]" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
            <span className="font-brand font-bold text-white text-xs sm:text-sm tracking-tight shrink-0">
              {displayName}
            </span>
            <span className="text-[#33343d] select-none text-xs hidden sm:inline">•</span>
            <a
              href={company.careers_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-[#888888] hover:text-[#c5a059] hover:underline font-mono transition-colors truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
              title={company.careers_url}
            >
              <span className="truncate">{company.careers_url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          {/* Delete icon visible on mobile right side of top row */}
          {user && user.role === 'admin' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCompany(company.id, displayName);
              }}
              className="sm:hidden p-1.5 rounded bg-[#18191d] hover:bg-rose-950/40 border border-[#292a33] text-[#666666] hover:text-rose-400 transition-colors shrink-0 ml-auto cursor-pointer"
              title="Delete Company Link"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right / Bottom: Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#22232a]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {/* Applied Checkbox Button */}
            <button
              onClick={handleAppliedClick}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-lg sm:rounded text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                isApplied
                  ? 'bg-[#557b55]/20 border-[#6ca86c] text-[#a9e2a9]'
                  : 'bg-[#18191d] hover:bg-[#202127] border-[#292a33] text-[#999999] hover:text-white'
              }`}
              title={isApplied ? 'Unmark from My Applications' : 'Mark as Applied'}
            >
              {isApplied ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#78c778] shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[#555555] shrink-0" />
              )}
              <span>Applied</span>
            </button>

            {/* Interviewed Checkbox Button */}
            <button
              onClick={handleInterviewedClick}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-lg sm:rounded text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                isInterviewed
                  ? 'bg-[#c5a059]/20 border-[#c5a059] text-[#e0c48e]'
                  : 'bg-[#18191d] hover:bg-[#202127] border-[#292a33] text-[#999999] hover:text-white'
              }`}
              title={isInterviewed ? 'Unmark from Interviewed' : 'Mark as Interviewed'}
            >
              {isInterviewed ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[#555555] shrink-0" />
              )}
              <span>Interviewed</span>
            </button>
          </div>

          {/* Admin Delete (Desktop) */}
          {user && user.role === 'admin' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCompany(company.id, displayName);
              }}
              className="hidden sm:inline-flex p-1.5 rounded bg-[#18191d] hover:bg-rose-950/40 border border-[#292a33] hover:border-rose-900 text-[#555555] hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
              title="Delete Company Link"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

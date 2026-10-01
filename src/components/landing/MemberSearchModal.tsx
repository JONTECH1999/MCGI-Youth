import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, User, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { Member } from '../../types/member';

interface MemberSearchModalProps {
  isOpen: boolean;
  initialQuery?: string;
  members: Member[];
  onClose: () => void;
  onSelectMember: (member: Member) => void;
}

export const MemberSearchModal: React.FC<MemberSearchModalProps> = ({
  isOpen,
  initialQuery = '',
  members,
  onClose,
  onSelectMember,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setSearchTerm(initialQuery);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mask Member ID for search results to safeguard privacy
  const maskMemberId = (id: string) => {
    if (!id || id.length <= 3) return 'M-••••';
    const prefix = id.slice(0, 2);
    const suffix = id.slice(-2);
    return `${prefix}••••${suffix}`;
  };

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];

    return members
      .filter((m) => {
        const full = m.fullName.toLowerCase();
        const first = m.firstName.toLowerCase();
        const last = m.lastName.toLowerCase();
        const id = m.memberId.toLowerCase();
        return full.includes(q) || first.includes(q) || last.includes(q) || id.includes(q);
      })
      .slice(0, 15);
  }, [searchTerm, members]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-20 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Box */}
        <div className="p-5 sm:p-6 border-b border-stone-100 bg-[#FAF7F2]">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Search className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-stone-900">Search My Name</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mt-1">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type your name or Member ID..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 placeholder-stone-400 text-base outline-none shadow-xs"
            />
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          </div>

          <p className="mt-2.5 text-xs text-stone-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Privacy mode: Contact numbers and addresses are hidden until verification.</span>
          </p>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-stone-100">
          {!searchTerm.trim() ? (
            <div className="py-10 text-center text-stone-500 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs animate-float-gentle">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800">Type your first name, last name, or Member ID</p>
                <p className="text-xs text-stone-400 mt-0.5">Quickly find your personal standing and attendance log</p>
              </div>

              {/* Sample Quick Fill Chips for easy exploration */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Try quick lookup:</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {members.slice(0, 4).map((m) => (
                    <button
                      key={m.memberId}
                      type="button"
                      onClick={() => setSearchTerm(m.firstName)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 text-xs font-medium transition cursor-pointer"
                    >
                      {m.fullName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-3">
              <HelpCircle className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-semibold text-stone-700">No member found matching "{searchTerm}"</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Please double-check your spelling, or ask your local youth committee officer to ensure your membership record is up to date.
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.memberId}
                onClick={() => onSelectMember(member)}
                className="py-3 px-3.5 rounded-2xl hover:bg-amber-50/80 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs border border-transparent hover:border-amber-200/80"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 group-hover:bg-amber-800 group-hover:text-white transition-all duration-200 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs">
                    {member.firstName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-900 truncate">
                      {member.fullName}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-stone-500 mt-0.5">
                      <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                        {maskMemberId(member.memberId)}
                      </span>
                      <span>•</span>
                      <span>{member.memberCategory} Youth</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-shimmer inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-stone-100 group-hover:bg-amber-800 text-stone-700 group-hover:text-white text-xs font-bold transition-all duration-200 shrink-0 shadow-2xs group-hover:shadow-md"
                >
                  <span>Select</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500">
          <span>Need help finding your record? Contact your local youth officer.</span>
        </div>
      </div>
    </div>
  );
};

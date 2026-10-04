import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, User, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { Member } from '../../types/member';
import { isSupabaseRequired } from '../../services/supabaseClient';

interface SecureCheckInResult {
  success: boolean;
  duplicate?: boolean;
  message: string;
}

interface MemberSearchModalProps {
  isOpen: boolean;
  initialQuery?: string;
  members: Member[];
  onClose: () => void;
  onSelectMember: (member: Member) => void;
  activeGatheringTitle?: string;
  onQuickAttend?: (member: Member) => Promise<void>;
  isAlreadyAttended?: (memberId: string) => boolean;
  onSecureCheckIn?: (memberId: string, birthday: string) => Promise<SecureCheckInResult>;
}

export const MemberSearchModal: React.FC<MemberSearchModalProps> = ({
  isOpen,
  initialQuery = '',
  members,
  onClose,
  onSelectMember,
  activeGatheringTitle,
  onQuickAttend,
  isAlreadyAttended,
  onSecureCheckIn,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [attendingMemberId, setAttendingMemberId] = useState<string | null>(null);
  const [secureMemberId, setSecureMemberId] = useState('');
  const [secureBirthday, setSecureBirthday] = useState('');
  const [secureResult, setSecureResult] = useState<SecureCheckInResult | null>(null);
  const [isSecureSubmitting, setIsSecureSubmitting] = useState(false);

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
        const full = (m.fullName || '').toLowerCase();
        const first = (m.firstName || '').toLowerCase();
        const last = (m.lastName || '').toLowerCase();
        const id = (m.memberId || '').toLowerCase();
        return full.includes(q) || first.includes(q) || last.includes(q) || id.includes(q);
      })
      .slice(0, 20);
  }, [searchTerm, members]);

  if (!isOpen) return null;

  const handleAttendClick = async (e: React.MouseEvent, member: Member) => {
    e.stopPropagation();
    if (!onQuickAttend) return;
    setAttendingMemberId(member.memberId);
    try {
      await onQuickAttend(member);
    } finally {
      setAttendingMemberId(null);
    }
  };

  const handleSecureCheckIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onSecureCheckIn) return;
    setIsSecureSubmitting(true);
    setSecureResult(null);
    try {
      setSecureResult(await onSecureCheckIn(secureMemberId, secureBirthday));
    } catch {
      setSecureResult({ success: false, message: 'Check-in could not be completed. Please try again or ask an officer for help.' });
    } finally {
      setIsSecureSubmitting(false);
    }
  };


    if (isSupabaseRequired) {
      return (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/70 p-4 pt-12 backdrop-blur-xs animate-in fade-in duration-200 sm:pt-20"
          onClick={onClose}
        >
          <div
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-stone-100 bg-[#FAF7F2] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-amber-100 p-1.5 text-amber-800"><Search className="h-4 w-4" /></span>
                  <div>
                    <h3 className="text-lg font-bold leading-tight text-stone-900">Secure Member Check-In</h3>
                    {activeGatheringTitle && <p className="mt-0.5 text-xs font-semibold text-amber-800">For: {activeGatheringTitle}</p>}
                  </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-200/50 hover:text-stone-700" aria-label="Close check-in">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSecureCheckIn} className="space-y-4 p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-stone-600">Verify with your Member ID and full birthday. Your private member record is checked securely without loading the member list into this browser.</p>
              <div className="space-y-1.5">
                <label htmlFor="secure-checkin-member-id" className="block text-xs font-bold uppercase tracking-wider text-stone-700">Member ID</label>
                <input
                  id="secure-checkin-member-id"
                  autoFocus
                  required
                  value={secureMemberId}
                  onChange={(event) => setSecureMemberId(event.target.value)}
                  placeholder="e.g. M-1001"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 font-mono text-sm uppercase text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="secure-checkin-birthday" className="block text-xs font-bold uppercase tracking-wider text-stone-700">Full Birthday</label>
                <input
                  id="secure-checkin-birthday"
                  type="date"
                  required
                  value={secureBirthday}
                  onChange={(event) => setSecureBirthday(event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              {secureResult && (
                <div className={`rounded-xl border p-3 text-sm ${secureResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`} role="status">
                  {secureResult.message}
                </div>
              )}
              <button
                type="submit"
                disabled={isSecureSubmitting || !onSecureCheckIn}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                {isSecureSubmitting ? 'Verifying...' : 'Verify & Record Attendance'}
              </button>
            </form>
          </div>
        </div>
      );
    }
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
              <div>
                <h3 className="text-lg font-bold text-stone-900 leading-tight">Search Name & Attend</h3>
                {activeGatheringTitle && (
                  <p className="text-xs text-amber-800 font-semibold mt-0.5">
                    For: {activeGatheringTitle}
                  </p>
                )}
              </div>
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
              placeholder="Search your name or Member ID (e.g. B. JOHN, M-0000)..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 placeholder-stone-400 text-base outline-none shadow-xs"
            />
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          </div>

          <p className="mt-2.5 text-xs text-stone-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Search by first or last name, or Member ID. Select your match, then tap Attend to record your presence.</span>
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
                <p className="text-sm font-bold text-stone-800">Find your attendance record</p>
                <p className="text-xs text-stone-500 mt-0.5">Search by first name, last name, or Member ID. Choose the matching record to continue.</p>
              </div>

              <div className="pt-1">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Example searches</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-600">B. JOHN</span>
                  <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-600 font-mono">M-0000</span>
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
            filteredMembers.map((member) => {
              const alreadyPresent = isAlreadyAttended ? isAlreadyAttended(member.memberId) : false;
              const isProcessing = attendingMemberId === member.memberId;

              return (
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-900 truncate">
                          {member.fullName}
                        </h4>
                        {alreadyPresent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ PRESENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-stone-500 mt-0.5">
                        <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                          {member.memberId}
                        </span>
                        <span>•</span>
                        <span>{member.memberCategory} Youth</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onQuickAttend && (
                      <button
                        type="button"
                        onClick={(e) => handleAttendClick(e, member)}
                        disabled={isProcessing}
                        title={alreadyPresent ? 'Retry syncing this attendance record to Google Sheets' : 'Record attendance'}
                        className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-2xs ${
                          alreadyPresent
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer'
                            : isProcessing
                            ? 'bg-amber-400 text-amber-950 animate-pulse cursor-wait'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <span>{alreadyPresent ? (isProcessing ? 'Syncing...' : 'Sync to Sheet') : isProcessing ? 'Marking...' : '✓ Attend'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectMember(member)}
                      className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-100 group-hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer"
                      title="View attendance record & profile"
                    >
                      <span>Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
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

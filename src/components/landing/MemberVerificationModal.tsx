import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, AlertCircle, ArrowRight, Lock, KeyRound, CheckCircle } from 'lucide-react';
import { Member } from '../../types/member';
import { VerificationMethod } from '../../types/landingPage';

interface MemberVerificationModalProps {
  member: Member | null;
  verificationMethod: VerificationMethod;
  onClose: () => void;
  onVerified: (member: Member) => void;
}

export const MemberVerificationModal: React.FC<MemberVerificationModalProps> = ({
  member,
  verificationMethod,
  onClose,
  onVerified,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue('');
    setError(null);
  }, [member]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!member) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verificationMethod === 'member_id') {
      const cleanInput = inputValue.trim().toLowerCase();
      const cleanActual = member.memberId.trim().toLowerCase();
      const cleanDigitsInput = cleanInput.replace(/\D/g, '');
      const cleanDigitsActual = cleanActual.replace(/\D/g, '');

      if (cleanInput === cleanActual || (cleanDigitsInput && cleanDigitsInput === cleanDigitsActual)) {
        onVerified(member);
      } else {
        setError('The Member ID you entered does not match this record. Please try again.');
      }
    } else if (verificationMethod === 'birthday') {
      // Birthday check: format YYYY-MM-DD
      const cleanInput = inputValue.trim();
      if (!cleanInput) {
        setError('Please enter your birth date or birth year.');
        return;
      }
      if (member.birthday && member.birthday.includes(cleanInput)) {
        onVerified(member);
      } else {
        setError('The birth date details do not match this member profile.');
      }
    } else {
      // Simple direct confirmation
      onVerified(member);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Verify Identity
          </h3>
          <p className="text-xs text-stone-500">
            To prevent unauthorized check-in and protect member privacy, please confirm your identity.
          </p>
        </div>

        {/* Selected Member Capsule */}
        <div className="my-4 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD5] flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-800 text-white flex items-center justify-center font-bold text-sm">
            {member.firstName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-stone-900 truncate">{member.fullName}</h4>
            <p className="text-xs text-stone-500">{member.memberCategory} Youth • {member.committees.join(', ') || 'General'}</p>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          {verificationMethod === 'member_id' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Enter your Member ID:
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  required
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. M-1001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm font-mono outline-none uppercase"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-stone-400">
                Tip: You can enter your full ID (e.g. M-1001) or just the digits (1001).
              </p>
            </div>
          )}

          {verificationMethod === 'birthday' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Enter your Birth Year or Birthday:
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  required
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. 2008 or 2008-05-14"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm outline-none"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {verificationMethod === 'simple' && (
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs">
              Are you confirming that you are <strong>{member.fullName}</strong>? Your attendance will be recorded under your name.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
            >
              <span>Confirm & Proceed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

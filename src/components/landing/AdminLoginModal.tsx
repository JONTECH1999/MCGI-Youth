import React, { useState } from 'react';
import { Lock, X, Shield, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const { login, officers } = useAuth();
  const [identifier, setIdentifier] = useState('aljon.admin');
  const [passkey, setPasskey] = useState('1234');
  const [showPasskey, setShowPasskey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(identifier, passkey);
      if (res.success) {
        onSuccessLogin();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectQuickOfficer = (username: string) => {
    setIdentifier(username);
    setPasskey('1234');
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200"
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

        <div className="text-center space-y-2 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Officer & Admin Portal
          </h3>
          <p className="text-xs text-stone-500">
            Sign in with authorized youth officer credentials to access the administrative system.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Select Officer Profile:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {officers.slice(0, 2).map((off) => (
                <button
                  key={off.id}
                  type="button"
                  onClick={() => handleSelectQuickOfficer(off.username)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    identifier === off.username
                      ? 'border-amber-700 bg-amber-50/80 ring-1 ring-amber-700'
                      : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 truncate">{off.fullName.split(' ')[1] || off.fullName}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-amber-200 text-amber-900">{off.role}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5 truncate">{off.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Username or Email
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. aljon.admin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 focus:border-amber-700 text-stone-900 text-xs font-medium outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Officer Passkey
              </label>
              <span className="text-[10px] text-stone-400">Default: 1234</span>
            </div>
            <div className="relative">
              <input
                type={showPasskey ? 'text' : 'password'}
                required
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-stone-300 focus:border-amber-700 text-stone-900 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasskey(!showPasskey)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

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
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Sign In as Officer'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

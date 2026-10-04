import React, { useState } from 'react';
import {
  Lock,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  UserCheck,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { isLocalDemoAuthEnabled, isSupabaseConfigured } from '../services/supabaseClient';

interface OfficerLoginPageProps {
  onSuccess: () => void;
  onBackToPublic: () => void;
}

export const OfficerLoginPage: React.FC<OfficerLoginPageProps> = ({ onSuccess, onBackToPublic }) => {
  const { login } = useAuth();
  const { landingPageConfig } = useAppData();

  const [identifier, setIdentifier] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login(identifier, passkey);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with authentication system.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = async (username: string, key: string) => {
    setIdentifier(username);
    setPasskey(key);
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = await login(username, key);
    setIsSubmitting(false);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBackToPublic}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>← Back to Public Member Website</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Officer Gateway</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="my-auto max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg ring-4 ring-blue-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authorized Access Only</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Youth Officer Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {landingPageConfig?.chapterName || 'MCGI YOUTH • LOCAL OF ASCOVILLE'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300 uppercase tracking-wider">
                {isSupabaseConfigured || !isLocalDemoAuthEnabled ? 'Supabase Account Email' : 'Officer Username or Email'}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isSupabaseConfigured || !isLocalDemoAuthEnabled ? 'Enter your Supabase Auth email' : 'e.g. aljon.admin or officer.attendance'}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 text-sm outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300 uppercase tracking-wider">
                {isSupabaseConfigured || !isLocalDemoAuthEnabled ? 'Account Password' : 'Officer Passkey'}
              </label>
              <div className="relative">
                <input
                  type={showPasskey ? 'text' : 'password'}
                  required
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter your security passkey..."
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-500 text-sm outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(!showPasskey)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating Officer...</span>
                ) : (
                  <>
                    <span>Enter Administrative System</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick-Fill Demo Officer Cards */}
          {isLocalDemoAuthEnabled && !isSupabaseConfigured && <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Attendance Officer Profile</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('officer.attendance', '1234')}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-blue-400">Attendance Desk</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-500/20 text-blue-300">OFFICER</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Attendance Officer</p>
              </button>
            </div>
          </div>}
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500 max-w-sm mx-auto">
            {isSupabaseConfigured || !isLocalDemoAuthEnabled
            ? 'Administrative data is protected by Supabase Auth and database row-level security.'
            : 'Administrative operations, attendance edits, and member changes are logged in the Google Sheets audit log.'}
        </p>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-600">
        MCGI Youth Membership, Attendance & Reporting System • {isSupabaseConfigured ? 'Supabase Database' : 'Google Sheets Architecture'}
      </div>
    </div>
  );
};

import React from 'react';
import {
  Menu,
  RefreshCw,
  FileSpreadsheet,
  CloudOff,
  Cloud,
  CheckCircle,
  AlertCircle,
  Zap,
  Globe,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useOffline } from '../../context/OfflineContext';
import { useAuth } from '../../context/AuthContext';
import { NavItemKey } from './Sidebar';

interface TopbarProps {
  currentTab: NavItemKey;
  onOpenMobile: () => void;
  onNavigateTab: (tab: NavItemKey) => void;
  onBackToPublic?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onOpenMobile,
  onNavigateTab,
  onBackToPublic,
}) => {
  const {
    connectionStatus,
    isSyncing,
    syncFromGoogleSheets,
    lastSyncTimestamp,
  } = useAppData();

  const { isOnline, pendingSyncCount, syncNow, isSyncing: isFlushingQueue } = useOffline();
  const { isAdmin } = useAuth();

  const getPageTitle = (tab: NavItemKey) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Administrative Dashboard', subtitle: 'Live overview of membership, attendance trends & demographics' };
      case 'members':
        return { title: 'Youth Members Directory', subtitle: 'Manage, search, register, and review youth records' };
      case 'attendance':
        return { title: 'Fast Attendance Interface', subtitle: 'Optimized batch attendance recording for events and services' };
      case 'events':
        return { title: 'Events & Schedules Management', subtitle: 'Configure multi-schedule events, prayer meetings, and worships' };
      case 'activity':
        return { title: 'Member Activity Monitoring', subtitle: 'Track active, regular, at-risk, and inactive youth with custom rules' };
      case 'demographics':
        return { title: 'Demographics Analysis', subtitle: 'Age, education, employment, voter status, and committee breakdown' };
      case 'statistics':
        return { title: 'Membership & Attendance Statistics', subtitle: 'Official statistical breakdowns matching MCGI reporting standards' };
      case 'reports':
        return { title: 'Official Reports & Snapshots', subtitle: 'Generate and preserve official period snapshots' };
      case 'google-sheets':
        return { title: 'Google Sheets Integration', subtitle: 'Official primary database connection and sync status' };
      case 'settings':
        return { title: 'System Settings & Inactivity Rules', subtitle: 'Attendance rules, thresholds, and administrative configuration' };
      default:
        return { title: 'MCGI Youth Administrative System', subtitle: '' };
    }
  };

  const pageInfo = getPageTitle(currentTab);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-cream-300 bg-cream-50/95 px-4 sm:px-6 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-charcoal-700 hover:bg-cream-200 lg:hidden focus:outline-hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-charcoal-950 leading-tight">
            {pageInfo.title}
          </h2>
          <p className="hidden md:block text-xs text-slate-500">{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* Action / Status Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline Queue Badge */}
        {pendingSyncCount > 0 && (
          <button
            onClick={syncNow}
            disabled={isFlushingQueue || !isOnline}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium hover:bg-amber-100 transition-colors"
            title="Unsaved changes queued locally. Click to sync."
          >
            <CloudOff className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            <span>{pendingSyncCount} unsaved</span>
          </button>
        )}

        {/* Google Sheets Connection Status */}
        {isAdmin && (
          <button
            onClick={() => onNavigateTab('google-sheets')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
              connectionStatus === 'Connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : connectionStatus === 'Checking'
                ? 'bg-cream-100 border-cream-300 text-bronze-700'
                : 'bg-cream-100 border-cream-300 text-charcoal-700 hover:bg-cream-200'
            }`}
            title="Click to manage Google Sheets database connection"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {connectionStatus === 'Connected' ? 'Sheets Connected' : 'Google Sheets'}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'Connected'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'Checking'
                  ? 'bg-bronze-500 animate-ping'
                  : 'bg-amber-400'
              }`}
            />
          </button>
        )}

        {/* Sync / Refresh Button */}
        {isAdmin && (
          <button
            onClick={() => syncFromGoogleSheets()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-3 py-1.5 text-xs font-medium text-charcoal-800 shadow-2xs hover:bg-cream-100 focus:outline-hidden disabled:opacity-50"
            title={lastSyncTimestamp ? `Last sync: ${new Date(lastSyncTimestamp).toLocaleTimeString()}` : 'Sync with Google Sheets'}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-charcoal-500 ${isSyncing ? 'animate-spin text-bronze-700' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        )}

        {/* Quick Fast Attendance Button */}
        {currentTab !== 'attendance' && (
          <button
            onClick={() => onNavigateTab('attendance')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-bronze-600 focus:outline-hidden cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Take Attendance</span>
          </button>
        )}

        {/* View Public Portal */}
        {onBackToPublic && (
          <button
            onClick={onBackToPublic}
            className="inline-flex items-center gap-1.5 rounded-lg bg-bronze-500 hover:bg-bronze-600 px-3 py-1.5 text-xs font-bold text-charcoal-950 shadow-2xs transition cursor-pointer"
            title="Switch to public member landing page"
          >
            <Globe className="h-3.5 w-3.5 text-amber-300" />
            <span className="hidden sm:inline">Public Portal</span>
          </button>
        )}
      </div>
    </header>
  );
};

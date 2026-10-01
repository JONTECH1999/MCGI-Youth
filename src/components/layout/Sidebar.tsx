import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  CalendarDays,
  Activity,
  PieChart,
  BarChart3,
  FileText,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  UserCheck,
  Bell,
  Globe,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavItemKey =
  | 'dashboard'
  | 'members'
  | 'attendance'
  | 'events'
  | 'announcements'
  | 'landing-page'
  | 'activity'
  | 'demographics'
  | 'statistics'
  | 'reports'
  | 'google-sheets'
  | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onBackToPublic?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  onBackToPublic,
  onLogout,
}) => {
  const { user, isAdmin, logout, switchRolePreview } = useAuth();

  interface NavItemDef {
    key: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    highlight?: boolean;
  }

  const navItems: NavItemDef[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'attendance', label: 'Fast Attendance', icon: CheckCircle2, badge: 'Quick' },
    { key: 'events', label: 'Events & Schedules', icon: CalendarDays },
    { key: 'announcements', label: 'Announcements', icon: Bell },
    { key: 'landing-page', label: 'Landing Page & Hero', icon: Globe },
    { key: 'activity', label: 'Member Activity', icon: Activity },
    { key: 'demographics', label: 'Demographics', icon: PieChart },
    { key: 'statistics', label: 'Statistics', icon: BarChart3 },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'google-sheets', label: 'Google Sheets', icon: FileSpreadsheet, highlight: true },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm tracking-wider shadow-sm">
              MCGI
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide leading-tight">MCGI YOUTH</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Admin System</p>
            </div>
          </div>
        </div>

        {/* Back to Public Member Landing Page */}
        {onBackToPublic && (
          <div className="p-3 border-b border-slate-800 bg-amber-950/30">
            <button
              onClick={() => {
                onCloseMobile();
                onBackToPublic();
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-800/80 hover:bg-amber-700 text-amber-100 font-semibold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <span>← View Member Landing Page</span>
            </button>
          </div>
        )}

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key as NavItemKey);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* User Role Card & Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              ) : (
                <UserCheck className="h-4 w-4 text-blue-400" />
              )}
              <span className="text-xs font-semibold text-white">
                {isAdmin ? 'Administrator' : 'Youth Officer'}
              </span>
            </div>
            <button
              onClick={() => switchRolePreview(isAdmin ? 'OFFICER' : 'ADMIN')}
              title="Click to toggle role preview"
              className="text-[10px] text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Toggle
            </button>
          </div>
          <p className="text-[12px] font-semibold text-slate-200 truncate">
            {user?.fullName || 'Officer Session'}
          </p>
          <p className="text-[10px] text-slate-400 truncate mb-3">
            {user?.title || user?.email || 'Authorized Youth Officer'}
          </p>

          <button
            onClick={() => {
              logout();
              if (onLogout) onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md bg-slate-800/80 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-700/60 text-xs font-medium text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
            title="Sign out of Officer Portal"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

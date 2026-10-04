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

export const OFFICER_ALLOWED_TABS: NavItemKey[] = [
  'dashboard',
  'members',
  'attendance',
  'events',
  'reports',
];

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
  const { user, isAdmin, logout } = useAuth();

  interface NavItemDef {
    key: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
  }

  const navItems: NavItemDef[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'attendance', label: 'Fast Attendance', icon: CheckCircle2 },
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
  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => OFFICER_ALLOWED_TABS.includes(item.key));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-950/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-cream-50 text-charcoal-800 transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col border-r border-cream-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-[72px] shrink-0 items-center px-5 border-b border-cream-300 bg-white/80">
          <div>
            <h1 className="text-base font-bold text-charcoal-950 leading-tight">MCGI Youth</h1>
            <p className="mt-1 text-[10px] text-bronze-700 uppercase tracking-wider font-semibold">Local of Ascoville</p>
          </div>
        </div>

        {/* Back to Public Member Landing Page */}
        {onBackToPublic && (
          <div className="p-3 border-b border-cream-300 bg-cream-100">
            <button
              onClick={() => {
                onCloseMobile();
                onBackToPublic();
              }}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Globe className="w-3.5 h-3.5 text-blue-100" />
              <span>← View Member Landing Page</span>
            </button>
          </div>
        )}

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
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
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-charcoal-800 hover:bg-cream-200 hover:text-charcoal-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-bronze-700'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-bronze-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* User Role Card & Sign Out */}
        <div className="p-4 border-t border-cream-300 bg-white/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
              ) : (
                <UserCheck className="h-4 w-4 text-bronze-700" />
              )}
              <span className="text-xs font-semibold text-charcoal-950">
                {isAdmin ? 'Administrator' : 'Youth Officer'}
              </span>
            </div>
          </div>
          <p className="text-[12px] font-semibold text-charcoal-900 truncate">
            {user?.fullName || 'Officer Session'}
          </p>
          <p className="text-[10px] text-charcoal-600 truncate mb-3">
            {user?.title || user?.email || 'Authorized Youth Officer'}
          </p>

          <button
            onClick={() => {
              logout();
              if (onLogout) onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md bg-cream-100 hover:bg-rose-50 border border-cream-300 hover:border-rose-300 text-xs font-medium text-charcoal-700 hover:text-rose-800 transition-colors cursor-pointer"
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

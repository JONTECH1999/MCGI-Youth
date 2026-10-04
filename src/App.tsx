import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useAppData } from './context/AppDataContext';
import { OfflineProvider } from './context/OfflineContext';
import { AppDataProvider } from './context/AppDataContext';
import { Layout } from './components/layout/Layout';
import { NavItemKey, OFFICER_ALLOWED_TABS } from './components/layout/Sidebar';
import { isSupabaseConfigured } from './services/supabaseClient';

// Pages
import { LandingPage } from './pages/LandingPage';
import { OfficerLoginPage } from './pages/OfficerLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { FastAttendancePage } from './pages/FastAttendancePage';
import { EventsPage } from './pages/EventsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { LandingPageSettingsPage } from './pages/LandingPageSettingsPage';
import { MemberActivityPage } from './pages/MemberActivityPage';
import { DemographicsPage } from './pages/DemographicsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { GoogleSheetsPage } from './pages/GoogleSheetsPage';
import { SettingsPage } from './pages/SettingsPage';

const VALID_TABS: NavItemKey[] = [
  'dashboard',
  'members',
  'attendance',
  'events',
  'announcements',
  'landing-page',
  'activity',
  'demographics',
  'statistics',
  'reports',
  'google-sheets',
  'settings',
];

const parseLocation = (): { view: 'public' | 'admin'; tab: NavItemKey } => {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();

  if (hash === 'public') {
    return { view: 'public', tab: 'dashboard' };
  }

  if (hash.startsWith('admin')) {
    const parts = hash.split('/');
    const tabFromHash = parts[1] as NavItemKey;
    const tab = VALID_TABS.includes(tabFromHash) ? tabFromHash : 'dashboard';
    return { view: 'admin', tab };
  }

  // Fallback to localStorage if no hash
  const savedView = localStorage.getItem('mcgi_view_mode') as 'public' | 'admin' | null;
  const savedTab = localStorage.getItem('mcgi_active_tab') as NavItemKey | null;

  if (savedView === 'admin') {
    const tab = savedTab && VALID_TABS.includes(savedTab) ? savedTab : 'dashboard';
    return { view: 'admin', tab };
  }

  return { view: 'public', tab: 'dashboard' };
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isAdmin, isAuthReady, logout } = useAuth();
  const { isLoading: isAppDataLoading } = useAppData();
  const [navigation, setNavigation] = useState<{ view: 'public' | 'admin'; tab: NavItemKey }>(() => parseLocation());

  const viewMode = navigation.view;
  const currentTab = navigation.tab;

  const navigateTo = (view: 'public' | 'admin', tab?: NavItemKey) => {
    const nextTab = tab || currentTab || 'dashboard';
    setNavigation({ view, tab: nextTab });
    localStorage.setItem('mcgi_view_mode', view);
    localStorage.setItem('mcgi_active_tab', nextTab);
    if (view === 'public') {
      window.location.hash = 'public';
    } else {
      window.location.hash = `admin/${nextTab}`;
    }
  };

  const handleSelectTab = (tab: NavItemKey) => {
    navigateTo('admin', isAdmin || OFFICER_ALLOWED_TABS.includes(tab) ? tab : 'dashboard');
  };

  useEffect(() => {
    if (!isAuthenticated || isAdmin || OFFICER_ALLOWED_TABS.includes(currentTab)) return;
    setNavigation({ view: 'admin', tab: 'dashboard' });
    localStorage.setItem('mcgi_view_mode', 'admin');
    localStorage.setItem('mcgi_active_tab', 'dashboard');
    window.location.hash = 'admin/dashboard';
  }, [currentTab, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (isSupabaseConfigured && viewMode === 'public' && isAuthenticated) logout();
  }, [viewMode, isAuthenticated, logout]);

  // Sync state on hash change (e.g. browser Back / Forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseLocation();
      setNavigation(parsed);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync initial URL hash on mount if none was present
  useEffect(() => {
    if (!window.location.hash) {
      if (viewMode === 'admin') {
        window.location.hash = `admin/${currentTab}`;
      } else {
        window.location.hash = 'public';
      }
    }
  }, [viewMode, currentTab]);

  if (viewMode === 'public') {
    return <LandingPage onEnterAdmin={() => navigateTo('admin', currentTab || 'dashboard')} />;
  }

  if (!isAuthReady || (viewMode === 'admin' && isAuthenticated && isAppDataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 text-charcoal-800 text-sm">
        Restoring secure officer session...
      </div>
    );
  }

  // Admin access strictly gated behind Officer / Admin Authentication
  if (!isAuthenticated) {
    return (
      <OfficerLoginPage
        onSuccess={() => navigateTo('admin', currentTab || 'dashboard')}
        onBackToPublic={() => navigateTo('public')}
      />
    );
  }

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTab={handleSelectTab} />;
      case 'members':
        return <MembersPage />;
      case 'attendance':
        return <FastAttendancePage />;
      case 'events':
        return <EventsPage onNavigateTab={handleSelectTab} />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'landing-page':
        return <LandingPageSettingsPage onPreviewPublic={() => navigateTo('public')} />;
      case 'activity':
        return <MemberActivityPage onNavigateTab={handleSelectTab} />;
      case 'demographics':
        return <DemographicsPage />;
      case 'statistics':
        return <StatisticsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'google-sheets':
        return <GoogleSheetsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigateTab={handleSelectTab} />;
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      onBackToPublic={() => navigateTo('public')}
      onLogout={() => {
        logout();
        navigateTo('public');
      }}
    >
      {renderActivePage()}
    </Layout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <AppDataProvider>
          <AppContent />
        </AppDataProvider>
      </OfflineProvider>
    </AuthProvider>
  );
}

export default App;

import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { AppDataProvider } from './context/AppDataContext';
import { Layout } from './components/layout/Layout';
import { NavItemKey } from './components/layout/Sidebar';

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

const AppContent: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  // Public Landing Page opens FIRST by default!
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');

  if (viewMode === 'public') {
    return <LandingPage onEnterAdmin={() => setViewMode('admin')} />;
  }

  // Admin access strictly gated behind Officer / Admin Authentication
  if (!isAuthenticated) {
    return (
      <OfficerLoginPage
        onSuccess={() => setViewMode('admin')}
        onBackToPublic={() => setViewMode('public')}
      />
    );
  }

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTab={setCurrentTab} />;
      case 'members':
        return <MembersPage />;
      case 'attendance':
        return <FastAttendancePage />;
      case 'events':
        return <EventsPage onNavigateTab={setCurrentTab} />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'landing-page':
        return <LandingPageSettingsPage onPreviewPublic={() => setViewMode('public')} />;
      case 'activity':
        return <MemberActivityPage onNavigateTab={setCurrentTab} />;
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
        return <DashboardPage onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onBackToPublic={() => setViewMode('public')}
      onLogout={() => {
        logout();
        setViewMode('public');
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

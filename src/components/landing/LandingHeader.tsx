import React, { useState, useEffect } from 'react';
import {
  Search,
  Menu,
  X,
  Lock,
  User,
  Calendar,
  Bell,
  Palette,
  ChevronDown,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { Member } from '../../types/member';
import { ThemePalette } from '../../types/landingPage';

interface LandingHeaderProps {
  chapterName: string;
  activeMember: Member | null;
  onOpenSearch: () => void;
  onOpenStatus: () => void;
  onLogoutMember: () => void;
  onOpenAdminLogin: () => void;
  colorTheme: ThemePalette;
  onChangeTheme: (theme: ThemePalette) => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  chapterName,
  activeMember,
  onOpenSearch,
  onOpenStatus,
  onLogoutMember,
  onOpenAdminLogin,
  colorTheme,
  onChangeTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 15);
      if (totalScroll > 0) {
        setScrollProgress(Math.min(1, Math.max(0, currentScroll / totalScroll)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const themeLabels: Record<ThemePalette, { name: string; bg: string; dot: string }> = {
    beige: { name: 'Warm Sandstone', bg: 'bg-[#FAF7F2]', dot: 'bg-amber-600' },
    slate: { name: 'Modern Slate', bg: 'bg-slate-50', dot: 'bg-blue-600' },
    navy: { name: 'MCGI Navy', bg: 'bg-slate-900', dot: 'bg-indigo-700' },
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FAF7F2]/90 backdrop-blur-md shadow-md shadow-amber-950/5 border-b border-[#E6DFD5]/90'
          : 'bg-[#FAF7F2]/95 backdrop-blur-xs border-b border-[#E6DFD5]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 flex items-center justify-center text-white shadow-sm ring-1 ring-black/5 transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-beacon-green" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-lg text-stone-900 group-hover:text-amber-800 transition-colors">
                  MCGI YOUTH
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100/90 text-amber-800 border border-amber-300/60 shadow-2xs tracking-wider">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                {chapterName || 'MCGI YOUTH • LOCAL OF ASCOVILLE'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('announcements')}
              className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
            >
              Announcements
            </button>
            <button
              onClick={() => scrollToSection('upcoming-events')}
              className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
            >
              Upcoming Events
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
            >
              Community Guide
            </button>
          </nav>

          {/* Right Header Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100/80 hover:bg-stone-200/70 border border-stone-200/80 rounded-lg transition cursor-pointer"
                title="Switch Color Theme"
              >
                <Palette className="w-3.5 h-3.5 text-stone-500" />
                <span className="capitalize">{themeLabels[colorTheme]?.name || 'Theme'}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {themeDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setThemeDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    Design Palette
                  </div>
                  <button
                    onClick={() => {
                      onChangeTheme('beige');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 ${
                      colorTheme === 'beige' ? 'font-semibold text-amber-900 bg-amber-50/60' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                      <span>Warm Sandstone (Beige)</span>
                    </div>
                    {colorTheme === 'beige' && <span className="text-[10px] text-amber-700 font-bold">✓</span>}
                  </button>

                  <button
                    onClick={() => {
                      onChangeTheme('slate');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 ${
                      colorTheme === 'slate' ? 'font-semibold text-blue-900 bg-blue-50/60' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                      <span>Modern Swiss Slate</span>
                    </div>
                    {colorTheme === 'slate' && <span className="text-[10px] text-blue-700 font-bold">✓</span>}
                  </button>

                  <button
                    onClick={() => {
                      onChangeTheme('navy');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 ${
                      colorTheme === 'navy' ? 'font-semibold text-indigo-900 bg-indigo-50/60' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-700 inline-block" />
                      <span>MCGI Deep Navy</span>
                    </div>
                    {colorTheme === 'navy' && <span className="text-[10px] text-indigo-700 font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* If Member is identified / logged in */}
            {activeMember ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenStatus}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/70 text-amber-900 text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>{activeMember.firstName}</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-600 text-white rounded font-medium">
                    {activeMember.memberId}
                  </span>
                </button>
                <button
                  onClick={onLogoutMember}
                  title="Switch Member"
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Search My Name Primary CTA */
              <button
                onClick={onOpenSearch}
                className="btn-shimmer inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-800 text-amber-50 text-sm font-bold shadow-xs hover:shadow-lg hover:shadow-amber-900/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Search className="w-4 h-4 text-amber-300" />
                <span>Search My Name</span>
              </button>
            )}

            {/* Discreet Admin Login Access */}
            <button
              onClick={onOpenAdminLogin}
              className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition cursor-pointer"
              title="Officer / Admin Portal Access"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-lg bg-amber-800 text-white cursor-pointer"
              aria-label="Search Name"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-200/60 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E6DFD5] bg-[#FAF7F2] px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {activeMember && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-xs">
                  {activeMember.firstName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">{activeMember.fullName}</p>
                  <p className="text-[11px] text-amber-800 font-medium">ID: {activeMember.memberId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStatus();
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-amber-800 text-white rounded-lg cursor-pointer"
              >
                View Status
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left px-3 py-2.5 text-sm font-medium text-stone-800 rounded-lg hover:bg-stone-200/50 flex items-center space-x-2"
            >
              <span>Home</span>
            </button>
            <button
              onClick={() => scrollToSection('announcements')}
              className="text-left px-3 py-2.5 text-sm font-medium text-stone-800 rounded-lg hover:bg-stone-200/50 flex items-center space-x-2"
            >
              <Bell className="w-4 h-4 text-amber-700" />
              <span>Announcements</span>
            </button>
            <button
              onClick={() => scrollToSection('upcoming-events')}
              className="text-left px-3 py-2.5 text-sm font-medium text-stone-800 rounded-lg hover:bg-stone-200/50 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>Upcoming Events</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="text-left px-3 py-2.5 text-sm font-semibold text-amber-900 bg-amber-100/70 rounded-lg flex items-center space-x-2"
            >
              <Search className="w-4 h-4 text-amber-800" />
              <span>Search My Name & Attendance</span>
            </button>
          </div>

          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center space-x-2">
              <span>Theme:</span>
              <button
                onClick={() => onChangeTheme(colorTheme === 'beige' ? 'slate' : 'beige')}
                className="underline font-medium text-stone-800 capitalize cursor-pointer"
              >
                {themeLabels[colorTheme]?.name}
              </button>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdminLogin();
              }}
              className="inline-flex items-center space-x-1 text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </button>
          </div>
        </div>
      )}

      {/* Scroll Reading Progress Bar */}
      <div className="w-full h-[2.5px] bg-stone-200/40 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 origin-left transition-transform duration-75"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </div>
    </header>
  );
};

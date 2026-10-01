import React, { useState } from 'react';
import { Search, Sparkles, Calendar, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { AttendanceEvent } from '../../types/event';
import { Announcement } from '../../types/announcement';
import { Member } from '../../types/member';

interface LandingHeroProps {
  chapterName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  featuredEvent?: AttendanceEvent;
  featuredAnnouncement?: Announcement;
  activeMember: Member | null;
  onOpenSearch: () => void;
  onQuickSearch: (query: string) => void;
  onSelectEvent: (event: AttendanceEvent) => void;
  onSelectAnnouncement: (announcement: Announcement) => void;
  onOpenStatus: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  chapterName,
  heroTitle,
  heroSubtitle,
  heroImageUrl,
  featuredEvent,
  featuredAnnouncement,
  activeMember,
  onOpenSearch,
  onQuickSearch,
  onSelectEvent,
  onSelectAnnouncement,
  onOpenStatus,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [mouseCoords, setMouseCoords] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoords({
      x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onQuickSearch(searchInput.trim());
    } else {
      onOpenSearch();
    }
  };

  // Safe fallback if hero image is not configured or fails
  const fallbackHero = 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1920&q=80';
  const effectiveHeroImage = heroImageUrl || fallbackHero;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden bg-stone-950 text-stone-100 min-h-[600px] lg:min-h-[680px] flex items-center bg-dark-grain"
    >
      {/* Background Hero Banner with High Contrast Editorial Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src={effectiveHeroImage}
          alt="MCGI Youth Community"
          className="w-full h-full object-cover object-center transform scale-102 filter brightness-[0.72] contrast-[1.05]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackHero;
          }}
        />
        {/* Multilayered Warm Dark Overlay to ensure sharp contrast & readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/98 via-stone-950/85 to-stone-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-stone-950/50" />

        {/* Alive Interactive Mouse Spotlight Glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(750px circle at ${mouseCoords.x}% ${mouseCoords.y}%, rgba(217, 119, 6, 0.18), transparent 60%)`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Left Content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Community Scripture / Chapter Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 backdrop-blur-xs text-amber-300 text-xs font-bold tracking-wider uppercase shadow-2xs hover:bg-amber-500/25 transition">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
                <span>{chapterName || 'MCGI YOUTH • LOCAL OF ASCOVILLE'}</span>
              </div>

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-stone-700/60 text-stone-300 text-[11px] font-medium backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-beacon-green" />
                <span>1,480+ Youth Brethren Active</span>
              </div>
            </div>

            {/* Welcoming Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                {heroTitle || 'Welcome, Youth!'}
                <span className="block text-xl sm:text-2xl lg:text-3xl font-semibold text-amber-300/90 mt-2 font-serif italic">
                  "Let no man despise thy youth..." — 1 Timothy 4:12
                </span>
              </h1>
              <p className="text-base sm:text-lg text-stone-300 max-w-2xl font-normal leading-relaxed">
                {heroSubtitle ||
                  'Stay connected with our upcoming activities, spiritual gatherings, announcements, and verify your attendance.'}
              </p>
            </div>

            {/* If Member is already identified */}
            {activeMember ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/60 border border-amber-500/40 backdrop-blur-md max-w-xl space-y-3 card-alive">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-extrabold text-base shadow-sm ring-1 ring-amber-400/30">
                      {activeMember.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Identified Youth Member</p>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-beacon-green" />
                      </div>
                      <h4 className="text-base font-bold text-white tracking-tight">{activeMember.fullName}</h4>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5 shadow-2xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{activeMember.activityStatus}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={onOpenStatus}
                    className="btn-shimmer flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold text-center transition-all duration-200 cursor-pointer shadow-md hover:shadow-amber-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  >
                    View My Status & Attendance ({activeMember.attendancePercentage}%)
                  </button>
                  <button
                    onClick={onOpenSearch}
                    className="py-2.5 px-3.5 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 text-stone-300 hover:text-white text-xs font-semibold transition cursor-pointer border border-stone-700/60"
                  >
                    Switch Name
                  </button>
                </div>
              </div>
            ) : (
              /* High Visibility Member Search Bar / Button */
              <div className="pt-2 max-w-xl space-y-3">
                <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-amber-400 transition-colors">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search your name or Member ID (e.g. Juan, M-1001)..."
                      className="w-full pl-11 pr-4 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-stone-900/90 hover:bg-stone-900 border border-stone-700/80 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 text-white placeholder-stone-400 text-sm sm:text-base outline-none transition-all duration-200 shadow-xl backdrop-blur-md"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-shimmer py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 active:scale-95 text-white font-extrabold text-sm sm:text-base transition-all duration-200 shadow-lg shadow-amber-950/40 hover:shadow-amber-600/30 hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer shrink-0"
                  >
                    <span>Search My Name</span>
                    <ArrowRight className="w-4 h-4 text-amber-200" />
                  </button>
                </form>

                {/* Quick Hint Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="text-stone-500">Quick try:</span>
                  {['Juan Dela Cruz', 'Sister Maria', 'M000101'].map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => onQuickSearch(hint)}
                      className="px-2 py-0.5 rounded-md bg-stone-800/80 hover:bg-amber-950/70 hover:text-amber-200 text-stone-300 border border-stone-700/60 transition cursor-pointer text-[10px] font-mono"
                    >
                      {hint}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-stone-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Privacy-first design. Personal contact numbers and sensitive records are never revealed.</span>
                </p>
              </div>
            )}

            {/* Quick Action Navigation Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-medium text-stone-300">
              <span className="text-stone-400">Quick Portal:</span>
              <a
                href="#announcements"
                className="px-3.5 py-1.5 rounded-lg bg-stone-800/80 hover:bg-amber-900/60 hover:text-amber-200 text-stone-200 border border-stone-700/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                📢 Announcements Board
              </a>
              <a
                href="#upcoming-events"
                className="px-3.5 py-1.5 rounded-lg bg-stone-800/80 hover:bg-amber-900/60 hover:text-amber-200 text-stone-200 border border-stone-700/60 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                📅 Upcoming Gatherings
              </a>
              <button
                onClick={onOpenSearch}
                className="px-3.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border border-amber-600/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer font-semibold shadow-2xs"
              >
                ⚡ My Attendance Status
              </button>
            </div>
          </div>

          {/* Right Column: Featured Announcement or Gathering Card */}
          <div className="lg:col-span-5">
            {featuredEvent ? (
              <div className="group relative rounded-3xl overflow-hidden border border-stone-700/80 hover:border-amber-400/60 bg-stone-900/90 backdrop-blur-xl p-5 shadow-2xl transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(217,119,6,0.25)] animate-float-gentle">
                {/* Diagonal Hover Sheen */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-beacon-green" />
                    <span className="text-[11px] font-extrabold tracking-wider text-amber-400 uppercase">
                      Featured Gathering
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-2xs">
                    {featuredEvent.eventType}
                  </span>
                </div>

                {featuredEvent.eventImage && (
                  <div className="mt-3 relative h-44 rounded-2xl overflow-hidden bg-stone-950">
                    <img
                      src={featuredEvent.eventImage}
                      alt={featuredEvent.eventName}
                      className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-900/90 text-amber-300 text-[11px] font-bold backdrop-blur-xs border border-white/15">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{featuredEvent.startDate}</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <h3 className="text-xl font-extrabold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                    {featuredEvent.eventName}
                  </h3>
                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                    {featuredEvent.description || 'Join us for this sacred assembly with fellow youth.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-medium truncate max-w-[180px]">
                    📍 {featuredEvent.location || 'Main Sanctuary'}
                  </span>
                  <button
                    onClick={() => onSelectEvent(featuredEvent)}
                    className="btn-shimmer inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md hover:shadow-amber-900/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  >
                    <span>View Schedules</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-200" />
                  </button>
                </div>
              </div>
            ) : featuredAnnouncement ? (
              <div className="group relative rounded-3xl overflow-hidden border border-stone-700/80 hover:border-amber-400/60 bg-stone-900/90 backdrop-blur-xl p-5 shadow-2xl transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(217,119,6,0.25)] animate-float-gentle">
                {/* Diagonal Hover Sheen */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <span className="text-[11px] font-extrabold tracking-wider text-amber-400 uppercase">
                    Featured Announcement
                  </span>
                  <span className="text-[11px] text-stone-400">{featuredAnnouncement.publishDate}</span>
                </div>

                {featuredAnnouncement.image && (
                  <div className="mt-3 relative h-44 rounded-2xl overflow-hidden bg-stone-950">
                    <img
                      src={featuredAnnouncement.image}
                      alt={featuredAnnouncement.title}
                      className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <h3 className="text-xl font-extrabold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                    {featuredAnnouncement.title}
                  </h3>
                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                    {featuredAnnouncement.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">{featuredAnnouncement.location}</span>
                  <button
                    onClick={() => onSelectAnnouncement(featuredAnnouncement)}
                    className="btn-shimmer inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md hover:shadow-amber-900/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  >
                    <span>Read Details</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-200" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

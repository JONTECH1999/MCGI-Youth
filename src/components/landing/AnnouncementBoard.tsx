import React, { useEffect, useState } from 'react';
import { Bell, Calendar, MapPin, ArrowRight, Sparkles, Bookmark, Radio, History } from 'lucide-react';
import { Announcement } from '../../types/announcement';

interface AnnouncementBoardProps {
  announcements: Announcement[];
  onSelectAnnouncement: (announcement: Announcement) => void;
  title?: string;
  subtitle?: string;
  limit?: number;
  featuredAnnouncementId?: string;
}

interface AnnouncementEventWindow {
  startAt: number;
  endAt: number;
}

const getAnnouncementEventWindow = (eventDate?: string): AnnouncementEventWindow | null => {
  if (!eventDate) return null;

  const dateMatch = eventDate.match(/^([A-Za-z]+)\s+(\d{1,2})(.*?),?\s*(\d{4})/i);
  if (!dateMatch) return null;

  const year = Number(dateMatch[4]);
  const startDay = Number(dateMatch[2]);
  const startMonth = new Date(`${dateMatch[1]} 1, ${year}`).getMonth();
  if (Number.isNaN(startMonth)) return null;

  const rangeDays = dateMatch[3].match(/\d{1,2}/g);
  const endDay = rangeDays ? Number(rangeDays[rangeDays.length - 1]) : startDay;
  const endMonthName = dateMatch[3].match(/[-–—]\s*([A-Za-z]+)\s+\d{1,2}/)?.[1];
  const endMonth = endMonthName
    ? new Date(`${endMonthName} 1, ${year}`).getMonth()
    : startMonth;
  const timeMatch = eventDate.slice(dateMatch[0].length).match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i);
  let hour = timeMatch ? Number(timeMatch[1]) % 12 : 0;
  const minute = timeMatch?.[2] ? Number(timeMatch[2]) : 0;
  if (timeMatch?.[3].toLowerCase().startsWith('p')) hour += 12;

  const startAt = Date.UTC(year, startMonth, startDay, hour - 8, minute);
  const endAt = timeMatch
    ? Date.UTC(year, endMonth, endDay, hour - 8, minute) + 59_999
    : Date.UTC(year, endMonth, endDay, 15, 59, 59, 999);

  return { startAt, endAt };
};

export const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({
  announcements,
  onSelectAnnouncement,
  title,
  subtitle,
  limit,
  featuredAnnouncementId,
}) => {
  const [filter, setFilter] = useState<'All' | 'Featured' | 'Past'>('All');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const classifiedAnnouncements = announcements
    .filter((a) => a.status === 'Published')
    .map((announcement) => ({
      announcement,
      eventWindow: getAnnouncementEventWindow(announcement.eventDate),
    }));
  const pastAnnouncements = classifiedAnnouncements
    .filter(({ eventWindow }) => eventWindow && eventWindow.endAt < now)
    .sort((a, b) => (b.eventWindow?.endAt ?? 0) - (a.eventWindow?.endAt ?? 0))
    .map(({ announcement }) => announcement);
  const upcomingAnnouncements = classifiedAnnouncements
    .filter(({ eventWindow }) => !eventWindow || eventWindow.endAt >= now)
    .sort((a, b) => {
      if (a.eventWindow && b.eventWindow) return a.eventWindow.startAt - b.eventWindow.startAt;
      if (a.eventWindow) return -1;
      if (b.eventWindow) return 1;
      if (a.announcement.announcementId === featuredAnnouncementId) return -1;
      if (b.announcement.announcementId === featuredAnnouncementId) return 1;
      if (a.announcement.featured && !b.announcement.featured) return -1;
      if (!a.announcement.featured && b.announcement.featured) return 1;
      return new Date(b.announcement.publishDate).getTime() - new Date(a.announcement.publishDate).getTime();
    })
    .map(({ announcement }) => announcement);
  const featuredAnnouncements = upcomingAnnouncements.filter((announcement) => announcement.featured);
  const displayLimit = limit ?? announcements.length;
  const displayed = filter === 'Past'
    ? pastAnnouncements
    : (filter === 'Featured' ? featuredAnnouncements : upcomingAnnouncements).slice(0, displayLimit);

  // Placeholder fallback image for announcements without image
  const defaultPlaceholder =
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80';

  return (
    <section id="announcements" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-entry-reveal">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#E6DFD5] gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/60 text-xs font-bold tracking-wider uppercase shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            <span>Official Digital Board</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            {title || 'Announcements & Locale Circulars'}
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            {subtitle || 'Stay in the loop with pastoral reminders, upcoming youth activities, service guidelines, and local assemblies.'}
          </p>
        </div>

        {/* Filter Pills with Alive Active Indicators */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-200/60 rounded-2xl border border-stone-300/60 self-start md:self-auto backdrop-blur-xs">
          <button
            onClick={() => setFilter('All')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              filter === 'All'
                ? 'bg-amber-800 text-white shadow-md shadow-amber-900/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-300/50'
            }`}
          >
            All Bulletins ({upcomingAnnouncements.length})
          </button>
          <button
            onClick={() => setFilter('Featured')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
              filter === 'Featured'
                ? 'bg-amber-800 text-white shadow-md shadow-amber-900/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-300/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Featured ({featuredAnnouncements.length})</span>
          </button>
          <button
            onClick={() => setFilter('Past')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
              filter === 'Past'
                ? 'bg-amber-800 text-white shadow-md shadow-amber-900/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-300/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Events ({pastAnnouncements.length})</span>
          </button>
        </div>
      </div>

      {/* Grid of Announcement Cards */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 bg-white/70 rounded-3xl border border-dashed border-stone-300 p-8">
          <Bell className="w-12 h-12 text-stone-400 mx-auto mb-3 animate-float-gentle" />
          <h4 className="text-base font-bold text-stone-800">
            {filter === 'Past' ? 'No past events yet' : filter === 'Featured' ? 'No featured upcoming events' : 'No upcoming announcements'}
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            {filter === 'Past' ? 'Completed events will appear here.' : 'Check back later or view another board category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayed.map((ann, idx) => (
            <article
              key={ann.announcementId}
              onClick={() => onSelectAnnouncement(ann)}
              style={{ animationDelay: `${idx * 80}ms` }}
              className="group relative bg-white rounded-3xl border border-[#E6DFD5] hover:border-amber-500/70 card-alive overflow-hidden flex flex-col cursor-pointer shadow-xs active:scale-[0.985]"
            >
              {/* Card Image with Hover Zoom & Diagonal Sheen */}
              <div className="relative h-52 sm:h-56 bg-stone-100 overflow-hidden">
                <img
                  src={ann.image || defaultPlaceholder}
                  alt={ann.title}
                  className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultPlaceholder;
                  }}
                />
                {/* Image Vignette Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

                {/* Diagonal Hover Sheen Sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                {/* Featured Pill */}
                {ann.featured && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-600 text-white shadow-md flex items-center space-x-1.5 border border-amber-400/40">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured</span>
                  </div>
                )}

                {/* Date Badge */}
                {ann.eventDate ? (
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-950/85 backdrop-blur-md text-amber-300 border border-white/20 flex items-center space-x-1.5 shadow-md">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ann.eventDate}</span>
                  </div>
                ) : (
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-stone-950/75 backdrop-blur-xs text-stone-200">
                    Circular #{ann.announcementId.slice(-4)}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
                    <span className="flex items-center space-x-1">
                      <Bookmark className="w-3 h-3 text-amber-700" />
                      <span>{ann.publishDate}</span>
                    </span>
                    {ann.location && (
                      <span className="flex items-center space-x-1 truncate max-w-[150px] text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{ann.location}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                    {ann.title}
                  </h3>

                  <p className="text-stone-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                    {ann.description}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 group-hover:text-amber-950 flex items-center space-x-1.5">
                    <span>Read Circular</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform duration-200 text-amber-700" />
                  </span>
                  <span className="text-[10px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                    {ann.createdBy || 'Youth Secretariat'}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

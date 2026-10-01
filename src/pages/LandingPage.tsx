import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Shield,
  BookOpen,
  Music,
  HeartHandshake,
  LogOut,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Member } from '../types/member';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { Announcement } from '../types/announcement';

// Modals
import { MemberSearchModal } from '../components/landing/MemberSearchModal';
import { MemberVerificationModal } from '../components/landing/MemberVerificationModal';
import { MemberStatusModal } from '../components/landing/MemberStatusModal';
import { EventDetailsModal } from '../components/landing/EventDetailsModal';
import { AnnouncementDetailsModal } from '../components/landing/AnnouncementDetailsModal';
import { EventCheckInModal } from '../components/landing/EventCheckInModal';
import { AdminLoginModal } from '../components/landing/AdminLoginModal';

interface LandingPageProps {
  onEnterAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterAdmin }) => {
  const {
    members,
    events,
    schedules,
    attendance,
    announcements,
    landingPageConfig,
    recordMemberAttendance,
    checkMemberAttendance,
  } = useAppData();

  // Ambient cursor spotlight effect
  const spotlightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        spotlightRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Remember identified member across sessions on the device
  const [activeMember, setActiveMember] = useState<Member | null>(() => {
    const saved = localStorage.getItem('mcgi_portal_member');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const found = members.find((m) => m.memberId === parsed.memberId);
        return found || parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (activeMember) {
      const fresh = members.find((m) => m.memberId === activeMember.memberId);
      if (fresh) setActiveMember(fresh);
    }
  }, [members]);

  // Testimonials carousel state
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [pendingVerificationMember, setPendingVerificationMember] = useState<Member | null>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AttendanceEvent | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Check-In modal state
  const [checkInEvent, setCheckInEvent] = useState<AttendanceEvent | null>(null);
  const [checkInSchedule, setCheckInSchedule] = useState<EventSchedule | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Admin login modal state
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Quick search input in hero
  const [heroSearchText, setHeroSearchText] = useState('');

  // Search Handler
  const handleOpenSearchWithQuery = (query: string) => {
    setInitialSearchQuery(query);
    setIsSearchOpen(true);
  };

  const handleSelectMember = (member: Member) => {
    setIsSearchOpen(false);
    if (landingPageConfig.verificationMethod !== 'simple') {
      setPendingVerificationMember(member);
      setIsVerificationOpen(true);
    } else {
      handleCompleteVerification(member);
    }
  };

  const handleCompleteVerification = (member: Member) => {
    setActiveMember(member);
    localStorage.setItem('mcgi_portal_member', JSON.stringify(member));
    setIsVerificationOpen(false);
    setPendingVerificationMember(null);

    if (checkInEvent && checkInSchedule) {
      setIsCheckInOpen(true);
    } else {
      setIsStatusOpen(true);
    }
  };

  const handleLogoutMember = () => {
    setActiveMember(null);
    localStorage.removeItem('mcgi_portal_member');
    setIsStatusOpen(false);
  };

  const handleInitiateCheckIn = (event: AttendanceEvent, schedule: EventSchedule) => {
    setCheckInEvent(event);
    setCheckInSchedule(schedule);

    if (!activeMember) {
      setIsSearchOpen(true);
    } else {
      setIsCheckInOpen(true);
    }
  };

  const handleSelectLinkedEvent = (event: AttendanceEvent) => {
    setSelectedAnnouncement(null);
    setSelectedEvent(event);
  };

  // Testimonials data
  const testimonies = [
    {
      quote:
        'Being part of the MCGI Youth in CAMANAVA has kept my spiritual compass grounded. Having a clear and reliable check-in portal makes staying accountable to our gatherings effortless.',
      author: 'Bro. Joshua Ramos',
      role: 'Youth Choir Member · Caloocan Locale',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'The fellowship and Christian community across District 1 inspire us to serve with joy. Checking our attendance and upcoming schedules has never been this smooth and dignified.',
      author: 'Sis. Andrea Santos',
      role: 'Teatro Kristiano · Malabon Locale',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'As working youth, having transparent access to our prayer meeting schedules and thanksgiving records keeps us aligned with God’s work no matter how hectic school or work gets.',
      author: 'Bro. Mark Villanueva',
      role: 'Outreach Volunteer · Valenzuela Locale',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'The dedication of our district coordinators and secretariats is inspiring. This portal reflects genuine professionalism, orderliness, and Christian brotherhood.',
      author: 'Sis. Patricia Cruz',
      role: 'Secretariat Committee · Navotas Locale',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
  ];

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonies.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonies.length) % testimonies.length);
  };

  // 4 Core Sacred Gatherings (Practice Areas style)
  const defaultGatherings = [
    {
      num: '01',
      title: 'Prayer Meeting',
      subtitle: 'Midweek Spiritual Edification',
      desc: 'Regular midweek congregational gathering for deep prayer, biblical guidance, and strengthening of faith.',
      image: 'https://images.unsplash.com/photo-1445445294270-ce521a0e50dc?auto=format&fit=crop&w=800&q=80',
      type: 'prayer_meeting',
    },
    {
      num: '02',
      title: 'Worship Service',
      subtitle: 'Holy Sabbath Praise & Doctrine',
      desc: 'Reverent spiritual worship and doctrinal contemplation for all youth brethren and brethren in faith.',
      image: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=800&q=80',
      type: 'worship_service',
    },
    {
      num: '03',
      title: 'Thanksgiving of God’s People',
      subtitle: 'Weekly Celebration of Grace',
      desc: 'Congregational sacrifice of thanksgiving (Pasalamat) for God’s continuous mercy, protection, and guidance.',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
      type: 'tgp',
    },
    {
      num: '04',
      title: 'Youth Christian Fellowship',
      subtitle: 'KKTK Activities & Outreach',
      desc: 'Dynamic brotherhood events, charitable missions, bible studies, choir practice, and community service.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      type: 'special_event',
    },
  ];

  // Leadership Team (6 members)
  const committeeLeaders = [
    {
      name: 'Bro. Daniel Ramos',
      role: 'District Youth Coordinator',
      area: 'CAMANAVA District 1',
      experience: 'Youth Leadership · 8 Years in Service',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Abigail Mendoza',
      role: 'District Attendance Secretary',
      area: 'Secretariat & Records',
      experience: 'Data Management · 5 Years in Service',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bro. Michael Angelo Tan',
      role: 'Youth Choir Coordinator',
      area: 'Music Ministry',
      experience: 'Choral Conducting · 7 Years in Service',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Camille Evangelista',
      role: 'Teatro Kristiano Coordinator',
      area: 'Creative & Deaf Ministry',
      experience: 'Arts & Sign Language · 6 Years in Service',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bro. Christian Reyes',
      role: 'Community Outreach Head',
      area: 'Charity & Civic Action',
      experience: 'Public Service · 5 Years in Service',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bro. Ethan James Lopez',
      role: 'District Tech & IT Secretary',
      area: 'Systems & Infrastructure',
      experience: 'Google Cloud & Systems · 4 Years in Service',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="relative min-h-screen bg-cream-100 text-charcoal-900 selection:bg-bronze-500 selection:text-white">
      {/* Ambient Cursor Spotlight Overlay */}
      <div id="spotlight" ref={spotlightRef} className="spotlight" />

      {/* Navigation matching Leagally */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream-100/80 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" className="flex items-center space-x-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-charcoal-900 group-hover:text-bronze-600 transition">
              MCGI Youth
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-bronze-500"></span>
            <span className="text-[11px] uppercase tracking-wider text-charcoal-800/60 font-medium hidden sm:inline ml-1">
              CAMANAVA
            </span>
          </a>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-charcoal-800">
            <a href="#about" className="hover:text-bronze-600 transition">
              About District
            </a>
            <a href="#gatherings" className="hover:text-bronze-600 transition">
              Gatherings
            </a>
            <a href="#process" className="hover:text-bronze-600 transition">
              Check-In Process
            </a>
            <a href="#leadership" className="hover:text-bronze-600 transition">
              Youth Officers
            </a>
            <a href="#announcements" className="hover:text-bronze-600 transition">
              Announcements
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {activeMember ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsStatusOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-charcoal-900 rounded-full hover:bg-bronze-600 transition"
                >
                  <UserCheck className="w-3.5 h-3.5 text-bronze-400" />
                  <span>{activeMember.firstName}</span>
                </button>
                <button
                  onClick={handleLogoutMember}
                  title="Sign out of device"
                  className="p-2 text-charcoal-800 hover:text-red-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setInitialSearchQuery('');
                  setIsSearchOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-charcoal-900 rounded-full hover:bg-bronze-600 transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search My Name</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section matching Leagally */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-charcoal-950 text-white min-h-[560px] md:min-h-[640px] flex flex-col justify-between p-8 md:p-16">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={
                  landingPageConfig?.heroImageUrl ||
                  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1920&q=80'
                }
                alt="MCGI Youth Gathering"
                className="w-full h-full object-cover opacity-35 filter brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent"></div>
            </div>

            {/* Top Hero Pill */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase bg-white/10 backdrop-blur-md border border-white/15 text-cream-200">
                <span className="w-1.5 h-1.5 rounded-full bg-bronze-400"></span>
                MCGI Youth · CAMANAVA / NCR District 1
              </span>
            </div>

            {/* Center Content */}
            <div className="relative z-10 max-w-3xl my-auto py-12">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-normal leading-[1.08] tracking-tight">
                {landingPageConfig?.heroTitle ||
                  'Excellence in Christian service, steadfast in every gathering.'}
              </h1>
              <p className="mt-6 text-base sm:text-lg text-cream-200/80 font-light max-w-xl">
                {landingPageConfig?.heroSubtitle ||
                  'A vibrant spiritual community for youth brethren across Caloocan, Malabon, Navotas, and Valenzuela — built to nurture faith, service, and attendance diligence.'}
              </p>

              {/* Quick Search & Actions */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-xl">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={heroSearchText}
                    onChange={(e) => setHeroSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && heroSearchText.trim()) {
                        handleOpenSearchWithQuery(heroSearchText.trim());
                      }
                    }}
                    placeholder="Enter your name or Member ID..."
                    className="w-full pl-11 pr-4 py-3.5 text-xs font-normal bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-cream-300/60 focus:outline-none focus:ring-2 focus:ring-bronze-400 focus:bg-white/15 transition"
                  />
                  <Search className="w-4 h-4 text-cream-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={() => handleOpenSearchWithQuery(heroSearchText.trim())}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs uppercase tracking-widest font-semibold rounded-full bg-bronze-500 hover:bg-bronze-400 text-charcoal-950 transition shrink-0"
                >
                  Search Record
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-cream-300/80">
                <span>Or explore:</span>
                <a
                  href="#gatherings"
                  className="underline hover:text-white transition"
                >
                  Upcoming Gatherings
                </a>
                <span>·</span>
                <a
                  href="#announcements"
                  className="underline hover:text-white transition"
                >
                  Digital Announcements
                </a>
                <span>·</span>
                <a
                  href="#process"
                  className="underline hover:text-white transition"
                >
                  How Check-In Works
                </a>
              </div>
            </div>

            {/* Bottom Exploration Bar */}
            <div className="relative z-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-cream-300 font-light gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Official Google Sheets Database Active & Synchronized
              </span>
              <span>Caloocan · Malabon · Navotas · Valenzuela</span>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Split (Section 2 - About) matching Leagally */}
      <section id="about" className="py-24 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left 5 Cols: Narrative Copy & Image */}
            <div className="lg:col-span-5 space-y-8">
              <p className="text-xs uppercase tracking-widest font-semibold text-bronze-600">
                The District Story
              </p>
              <p className="text-charcoal-800 text-base leading-relaxed font-normal">
                Rooted in deep Christian love, biblical sound doctrine, and tireless brotherhood, the MCGI Youth in CAMANAVA (NCR District 1) unites young brethren in fulfilling our divine calling to be the salt and light of the world.
              </p>
              <div className="img-hover-zoom rounded-2xl aspect-[4/3] bg-cream-200">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80"
                  alt="MCGI Youth Fellowship"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right 7 Cols: Big Heading + Button + Mission Statement */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-10">
              <div className="space-y-6">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-charcoal-950">
                  Vibrant fellowship helping youth brethren across CAMANAVA walk in spiritual integrity.
                </h2>
                <a
                  href="#leadership"
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-semibold rounded-full bg-charcoal-900 hover:bg-bronze-600 text-white transition"
                >
                  Meet Our Youth Officers
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="pt-8 border-t border-cream-300">
                <p className="text-xs uppercase tracking-widest font-semibold text-bronze-600 mb-2">
                  Our Sacred Commission
                </p>
                <p className="text-charcoal-800 text-sm leading-relaxed max-w-xl font-light">
                  We maintain strict accountability and order in attendance recording, compassionate follow-up for on-and-off youth, and inspiring avenues for music, arts, and charitable missions across Northern NCR.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Areas Grid (Section 3 - Sacred Gatherings) matching Leagally */}
      <section id="gatherings" className="py-24 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-bronze-600 mb-2">
                Sacred Gatherings
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal-950 font-normal">
                Spiritual services & assemblies.
              </h2>
            </div>
            <p className="text-charcoal-800 text-sm max-w-md font-light leading-relaxed">
              Join congregational services, midweek prayer meetings, and special district youth gatherings scheduled across CAMANAVA locales.
            </p>
          </div>

          {/* 4-Card Practice Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {defaultGatherings.map((g, i) => {
              // Find matching real event from data if available
              const matchedEvent = events.find(
                (e) => e.eventType === g.type || e.eventName.toLowerCase().includes(g.title.toLowerCase())
              );
              return (
                <div
                  key={i}
                  className="group relative rounded-2xl overflow-hidden bg-charcoal-900 h-[480px] flex flex-col justify-end p-6 img-hover-zoom"
                >
                  <img
                    src={matchedEvent?.eventImage || g.image}
                    alt={g.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/60 to-transparent"></div>
                  <div className="relative z-10 space-y-3">
                    <span className="text-xs uppercase tracking-widest text-bronze-400 font-semibold">
                      {g.num}
                    </span>
                    <h3 className="font-serif text-2xl text-white font-normal leading-snug">
                      {matchedEvent ? matchedEvent.eventName : g.title}
                    </h3>
                    <p className="text-cream-200/70 text-xs font-light leading-relaxed">
                      {matchedEvent ? matchedEvent.description : g.desc}
                    </p>
                    <button
                      onClick={() => {
                        if (matchedEvent) {
                          setSelectedEvent(matchedEvent);
                        } else {
                          setInitialSearchQuery('');
                          setIsSearchOpen(true);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-bronze-400 group-hover:text-cream-50 font-medium pt-2 transition cursor-pointer"
                    >
                      <span>{matchedEvent ? 'View Schedule & Attend' : 'Check Attendance'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section (Section 4 - 3-Step Guide) matching Leagally */}
      <section id="process" className="py-24 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left 7 Cols: Image Banner */}
            <div className="lg:col-span-7 rounded-3xl overflow-hidden relative bg-charcoal-950 p-8 sm:p-14 flex flex-col justify-between min-h-[440px]">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
                alt="Process Background"
                className="absolute inset-0 w-full h-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-charcoal-950 via-charcoal-950/80 to-charcoal-900/60"></div>
              <div className="relative z-10">
                <span className="text-xs uppercase tracking-widest font-semibold text-bronze-400">
                  Member Portal Protocol
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-normal mt-4 leading-tight">
                  Simple, transparent, and direct — your peace of mind and youth records in three clicks.
                </h2>
              </div>
              <div className="relative z-10 pt-8">
                <button
                  onClick={() => {
                    setInitialSearchQuery('');
                    setIsSearchOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-semibold rounded-full bg-cream-100 text-charcoal-900 hover:bg-bronze-500 hover:text-white transition"
                >
                  Search Your Name Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right 5 Cols: 3 Process Cards */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              {/* Step 01 */}
              <div className="rounded-2xl bg-cream-200/50 p-6 border border-cream-300 transition-all hover:bg-cream-200/80">
                <span className="text-xs uppercase tracking-widest font-semibold text-bronze-600">
                  Step 01
                </span>
                <h4 className="font-serif text-xl text-charcoal-950 font-normal mt-2">
                  Search Your Record
                </h4>
                <p className="text-charcoal-800 text-xs mt-2 font-light leading-relaxed">
                  Type your name or unique Member ID into the portal. The system instantly matches your official membership record in Google Sheets.
                </p>
              </div>

              {/* Step 02 */}
              <div className="rounded-2xl bg-cream-200/50 p-6 border border-cream-300 transition-all hover:bg-cream-200/80">
                <span className="text-xs uppercase tracking-widest font-semibold text-bronze-600">
                  Step 02
                </span>
                <h4 className="font-serif text-xl text-charcoal-950 font-normal mt-2">
                  Verify Standing & Status
                </h4>
                <p className="text-charcoal-800 text-xs mt-2 font-light leading-relaxed">
                  Confirm your identity securely. View your committee memberships, attendance rate, registered locale, and active status in District 1.
                </p>
              </div>

              {/* Step 03 */}
              <div className="rounded-2xl bg-cream-200/50 p-6 border border-cream-300 transition-all hover:bg-cream-200/80">
                <span className="text-xs uppercase tracking-widest font-semibold text-bronze-600">
                  Step 03
                </span>
                <h4 className="font-serif text-xl text-charcoal-950 font-normal mt-2">
                  Check-In to Gatherings
                </h4>
                <p className="text-charcoal-800 text-xs mt-2 font-light leading-relaxed">
                  Select your current gathering and batch schedule. One tap logs your attendance securely with timestamp and duplicate protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Showcase (Section 5 - Youth Leadership) matching Leagally */}
      <section id="leadership" className="py-24 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs uppercase tracking-widest font-semibold text-bronze-600 mb-2">
              Youth Servant Leadership
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal-950 font-normal">
              Coordinators & Committee Heads.
            </h2>
            <p className="mt-4 text-charcoal-800 text-sm font-light">
              Elders, youth officers, and ministry coordinators committed to assisting brethren across Caloocan, Malabon, Navotas, and Valenzuela.
            </p>
          </div>

          {/* 6-Card Team Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {committeeLeaders.map((leader, i) => (
              <div
                key={i}
                className="group rounded-2xl overflow-hidden bg-cream-200 border border-cream-300 transition hover:shadow-lg"
              >
                <div className="h-[340px] overflow-hidden img-hover-zoom">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 space-y-2 bg-cream-50">
                  <span className="text-xs uppercase tracking-widest text-bronze-600 font-semibold">
                    {leader.area}
                  </span>
                  <h4 className="font-serif text-xl text-charcoal-950 font-normal">
                    {leader.name}
                  </h4>
                  <p className="text-charcoal-800 text-xs font-light">
                    {leader.role}
                  </p>
                  <p className="text-charcoal-800/70 text-[11px] pt-2 border-t border-cream-200">
                    {leader.experience}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Callout Banner (Section 6) matching Leagally */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl bg-charcoal-900 p-8 sm:p-14 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-charcoal-800">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-widest text-bronze-400 font-semibold">
                Spiritual Reminder · 1 Timothy 4:12
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal leading-snug">
                “Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.”
              </h3>
            </div>
            <button
              onClick={() => {
                setInitialSearchQuery('');
                setIsSearchOpen(true);
              }}
              className="shrink-0 inline-flex items-center gap-2 px-8 py-4 text-xs uppercase tracking-widest font-semibold rounded-full bg-bronze-500 hover:bg-bronze-400 text-charcoal-950 transition"
            >
              Check Attendance Record
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials (Section 7) matching Leagally */}
      <section className="py-24 border-t border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4 space-y-4">
              <p className="text-xs uppercase tracking-widest font-semibold text-bronze-600">
                Brethren Testimonies
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal-950 font-normal">
                Voices of our youth.
              </h2>
              <p className="text-charcoal-800 text-sm font-light leading-relaxed">
                Reflections and affirmations from active youth members serving across CAMANAVA District 1 locales.
              </p>
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={prevTestimonial}
                  aria-label="Previous testimony"
                  className="w-11 h-11 rounded-full border border-cream-300 flex items-center justify-center text-charcoal-900 hover:bg-cream-200 transition cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextTestimonial}
                  aria-label="Next testimony"
                  className="w-11 h-11 rounded-full border border-cream-300 flex items-center justify-center text-charcoal-900 hover:bg-cream-200 transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-xs text-charcoal-800/60 font-mono ml-2">
                  0{testimonialIndex + 1} / 0{testimonies.length}
                </span>
              </div>
            </div>

            <div className="lg:col-span-8 overflow-hidden">
              <div className="bg-cream-50 p-8 sm:p-12 rounded-3xl border border-cream-300 relative">
                <p className="font-serif text-xl sm:text-2xl text-charcoal-900 italic font-normal leading-relaxed">
                  “{testimonies[testimonialIndex].quote}”
                </p>
                <div className="mt-8 flex items-center gap-4 pt-6 border-t border-cream-200">
                  <img
                    src={testimonies[testimonialIndex].avatar}
                    alt={testimonies[testimonialIndex].author}
                    className="w-12 h-12 rounded-full object-cover border border-cream-300"
                  />
                  <div>
                    <h5 className="font-serif text-base font-medium text-charcoal-950">
                      {testimonies[testimonialIndex].author}
                    </h5>
                    <p className="text-xs text-bronze-600 font-medium">
                      {testimonies[testimonialIndex].role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insights / Blog Grid (Section 8 - Announcements & Circulars) matching Leagally */}
      <section id="announcements" className="py-24 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-bronze-600 mb-2">
                Perspectives & Circulars
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-charcoal-950 font-normal">
                Digital Announcement Board.
              </h2>
            </div>
            <button
              onClick={() => {
                if (announcements[0]) setSelectedAnnouncement(announcements[0]);
              }}
              className="text-xs uppercase tracking-widest font-semibold text-bronze-600 hover:text-charcoal-950 flex items-center gap-1 transition cursor-pointer"
            >
              <span>View Latest Bulletin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4-Card Editorial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(announcements.length > 0 ? announcements.slice(0, 4) : []).map(
              (ann, idx) => (
                <div
                  key={ann.announcementId || idx}
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="group flex flex-col justify-between bg-cream-50 rounded-2xl overflow-hidden border border-cream-300 cursor-pointer transition hover:shadow-lg h-[440px]"
                >
                  <div className="h-48 overflow-hidden img-hover-zoom bg-cream-200">
                    <img
                      src={
                        ann.image ||
                        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={ann.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-bronze-600 font-semibold uppercase tracking-wider">
                        <span>{ann.location || 'Official Bulletin'}</span>
                        <span className="text-charcoal-800/60 font-light">
                          {ann.publishDate || 'Recent'}
                        </span>
                      </div>
                      <h4 className="font-serif text-lg text-charcoal-950 font-normal leading-snug line-clamp-2">
                        {ann.title}
                      </h4>
                      <p className="text-charcoal-800 text-xs font-light line-clamp-3 leading-relaxed">
                        {ann.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-bronze-600 group-hover:text-charcoal-950 font-semibold transition pt-2 border-t border-cream-200">
                      Read Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Dark Footer (Section 9) matching Leagally */}
      <footer id="contact" className="bg-charcoal-950 text-cream-200 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
            {/* Left 4 Cols: Brand & Statement */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center space-x-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-white">
                  MCGI Youth
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-bronze-500"></span>
              </div>
              <p className="text-cream-300/70 text-xs font-light leading-relaxed max-w-sm">
                Members Church of God International Youth Fellowship — CAMANAVA / NCR District 1. Nurturing faith, fellowship, and diligent Christian stewardship across Caloocan, Malabon, Navotas, and Valenzuela.
              </p>
              <div className="pt-2 text-xs text-cream-300/50 font-mono">
                Official Database: Google Sheets (Single Source of Truth)
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2 space-y-4">
              <h5 className="text-xs uppercase tracking-widest font-semibold text-bronze-400">
                Navigation
              </h5>
              <ul className="space-y-2 text-xs font-light text-cream-300/80">
                <li>
                  <a href="#about" className="hover:text-white transition">
                    About District
                  </a>
                </li>
                <li>
                  <a href="#gatherings" className="hover:text-white transition">
                    Sacred Gatherings
                  </a>
                </li>
                <li>
                  <a href="#process" className="hover:text-white transition">
                    Check-In Process
                  </a>
                </li>
                <li>
                  <a href="#leadership" className="hover:text-white transition">
                    Youth Officers
                  </a>
                </li>
                <li>
                  <a href="#announcements" className="hover:text-white transition">
                    Announcements
                  </a>
                </li>
              </ul>
            </div>

            {/* Locales in District 1 */}
            <div className="lg:col-span-3 space-y-4">
              <h5 className="text-xs uppercase tracking-widest font-semibold text-bronze-400">
                District 1 Locales
              </h5>
              <ul className="space-y-2 text-xs font-light text-cream-300/80">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Caloocan Division (North & South)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Malabon Locale Coordinating Centers
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Navotas Coastal Chapter
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Valenzuela Eastern & Western Sectors
                </li>
              </ul>
            </div>

            {/* Administration & Officer Portal */}
            <div className="lg:col-span-3 space-y-4">
              <h5 className="text-xs uppercase tracking-widest font-semibold text-bronze-400">
                Administration
              </h5>
              <p className="text-xs font-light text-cream-300/70">
                Are you a designated youth officer, committee head, or district administrator?
              </p>
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-charcoal-950 bg-bronze-500 rounded-full hover:bg-bronze-400 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Officer Portal Login</span>
              </button>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-300/60 font-light gap-4">
            <p>
              &copy; {new Date().getFullYear()} MCGI Youth CAMANAVA / NCR District 1. To God Be The Glory.
            </p>
            <div className="flex items-center space-x-6">
              <span className="hover:text-cream-200">
                Privacy & Data Safeguards
              </span>
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="hover:text-bronze-400 transition cursor-pointer"
              >
                Youth Officer System
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Member Search Modal */}
      <MemberSearchModal
        isOpen={isSearchOpen}
        initialQuery={initialSearchQuery}
        members={members}
        onClose={() => setIsSearchOpen(false)}
        onSelectMember={handleSelectMember}
      />

      {/* 2. Member Identity Verification Modal */}
      <MemberVerificationModal
        member={pendingVerificationMember}
        verificationMethod={landingPageConfig?.verificationMethod || 'member_id'}
        onClose={() => {
          setIsVerificationOpen(false);
          setPendingVerificationMember(null);
        }}
        onVerified={handleCompleteVerification}
      />

      {/* 3. Member Status & Attendance Modal */}
      <MemberStatusModal
        member={activeMember}
        attendanceRecords={attendance}
        upcomingEvents={events.filter((e) => e.isPublished !== false)}
        schedules={schedules}
        onClose={() => setIsStatusOpen(false)}
        onLogout={handleLogoutMember}
        onInitiateCheckIn={handleInitiateCheckIn}
      />

      {/* 4. Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        schedules={schedules}
        activeMember={activeMember}
        attendanceRecords={attendance}
        onClose={() => setSelectedEvent(null)}
        onInitiateCheckIn={handleInitiateCheckIn}
        onOpenSearch={() => {
          setSelectedEvent(null);
          setIsSearchOpen(true);
        }}
      />

      {/* 5. Announcement Details Modal */}
      <AnnouncementDetailsModal
        announcement={selectedAnnouncement}
        linkedEvent={events.find(
          (e) => e.eventId === selectedAnnouncement?.linkedEventId
        )}
        onClose={() => setSelectedAnnouncement(null)}
        onSelectLinkedEvent={handleSelectLinkedEvent}
      />

      {/* 6. Event Check-In Modal with Duplicate Protection */}
      {checkInEvent && checkInSchedule && (
        <EventCheckInModal
          event={checkInEvent}
          schedule={checkInSchedule}
          member={activeMember}
          existingRecord={
            activeMember
              ? checkMemberAttendance(
                  activeMember.memberId,
                  checkInSchedule.scheduleId
                )
              : null
          }
          onClose={() => {
            setIsCheckInOpen(false);
            setCheckInEvent(null);
            setCheckInSchedule(null);
          }}
          onConfirmAttendance={recordMemberAttendance}
          onViewMyAttendance={() => {
            setIsCheckInOpen(false);
            setIsStatusOpen(true);
          }}
        />
      )}

      {/* 7. Officer / Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccessLogin={onEnterAdmin}
      />
    </div>
  );
};

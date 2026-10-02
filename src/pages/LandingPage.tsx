import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  CheckCircle,
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
  Video,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Member } from '../types/member';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { Announcement } from '../types/announcement';
import { GatheringItem } from '../types/landingPage';
import {
  RegularGatheringSlot,
  LOKAL_REGULAR_SCHEDULES,
  getAutomatedGatheringSlot,
  resolveOrCreateSlotEventSchedule,
  formatDateYYYYMMDD,
} from '../data/lokalSchedule';

// Modals
import { MemberSearchModal } from '../components/landing/MemberSearchModal';
import { MemberVerificationModal } from '../components/landing/MemberVerificationModal';
import { MemberStatusModal } from '../components/landing/MemberStatusModal';
import { EventDetailsModal } from '../components/landing/EventDetailsModal';
import { AnnouncementDetailsModal } from '../components/landing/AnnouncementDetailsModal';
import { EventCheckInModal } from '../components/landing/EventCheckInModal';
import { AdminLoginModal } from '../components/landing/AdminLoginModal';
import { GatheringSelectorModal } from '../components/landing/GatheringSelectorModal';

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
    saveEvent,
    saveSchedule,
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

  // Automated Gathering Slot (Auto-detects based on day of week and current time)
  const [selectedGatheringSlot, setSelectedGatheringSlot] = useState<RegularGatheringSlot>(
    () => getAutomatedGatheringSlot().slot
  );
  const [selectedGatheringDate, setSelectedGatheringDate] = useState<string>(
    () => getAutomatedGatheringSlot().dateStr
  );
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [isGatheringSelectorOpen, setIsGatheringSelectorOpen] = useState<boolean>(false);

  // Auto-update gathering slot if not manually overridden (polls every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isManualOverride) {
        const auto = getAutomatedGatheringSlot();
        if (auto.slot.slotId !== selectedGatheringSlot.slotId || auto.dateStr !== selectedGatheringDate) {
          setSelectedGatheringSlot(auto.slot);
          setSelectedGatheringDate(auto.dateStr);
        }
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [isManualOverride, selectedGatheringSlot.slotId, selectedGatheringDate]);

  // Schedule roster filter tab
  const [scheduleFilterTab, setScheduleFilterTab] = useState<'ALL' | 'PM' | 'WS' | 'TG'>('ALL');

  const handleSelectSlotFromSchedule = (slot: RegularGatheringSlot) => {
    setSelectedGatheringSlot(slot);
    setSelectedGatheringDate(formatDateYYYYMMDD(new Date()));
    setIsManualOverride(true);
    const element = document.getElementById('hero-attendance');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Check if member is already marked Present for active slot & date
  const isMemberAttendedForActiveSlot = (memberId: string): boolean => {
    if (!memberId) return false;
    return attendance.some((a) => {
      const memMatch = (a.memberId || (a as any).memberID) === memberId;
      const dateMatch = a.eventDate === selectedGatheringDate;
      const labelMatch =
        (a.schedule && a.schedule.toLowerCase().includes(selectedGatheringSlot.time.toLowerCase())) ||
        (a.schedule && a.schedule.toLowerCase().includes(selectedGatheringSlot.slotId.toLowerCase()));
      const eventMatch =
        (a.eventName && a.eventName.toLowerCase().includes(selectedGatheringSlot.eventType.toLowerCase())) ||
        (a.eventId && a.eventId.toLowerCase().includes(selectedGatheringSlot.eventType.toLowerCase()));
      return memMatch && dateMatch && (labelMatch || eventMatch) && a.attendanceStatus === 'Present';
    });
  };

  // Quick attend states
  const [attendingMemberId, setAttendingMemberId] = useState<string | null>(null);
  const [attendSuccessToast, setAttendSuccessToast] = useState<{
    memberName: string;
    gatheringName: string;
    time: string;
    date: string;
  } | null>(null);
  const [attendErrorToast, setAttendErrorToast] = useState<string | null>(null);

  // Handler for 1-Click Instant Attendance
  const handleQuickAttend = async (member: Member) => {
    const memId = member.memberId || (member as any).memberID;
    if (!memId) return;

    setAttendingMemberId(memId);
    setAttendErrorToast(null);

    try {
      // 1. Resolve or ensure AttendanceEvent and EventSchedule exist
      const { event, schedule } = await resolveOrCreateSlotEventSchedule(
        selectedGatheringSlot,
        selectedGatheringDate,
        events,
        schedules,
        saveEvent,
        saveSchedule
      );

      // 2. Record attendance as Present
      const curSchedId = schedule.scheduleId || (schedule as any).scheduleID;
      const curEvtId = event.eventId || (event as any).eventID;

      const res = await recordMemberAttendance({
        memberId: memId,
        eventId: curEvtId,
        scheduleId: curSchedId,
        scheduleLabel: `${selectedGatheringSlot.dayName} ${selectedGatheringSlot.time}`,
        eventName: selectedGatheringSlot.eventName,
        eventDate: selectedGatheringDate,
        recordedBy: `${member.fullName} (Self Check-in)`,
      });

      if (res.success || res.duplicate) {
        setActiveMember(member);
        localStorage.setItem('mcgi_portal_member', JSON.stringify(member));

        setAttendSuccessToast({
          memberName: member.fullName,
          gatheringName: selectedGatheringSlot.eventName,
          time: selectedGatheringSlot.time,
          date: selectedGatheringDate,
        });

        setTimeout(() => {
          setAttendSuccessToast(null);
        }, 7000);
      } else {
        setAttendErrorToast(res.message);
      }
    } catch (err: any) {
      setAttendErrorToast(err.message || 'Error recording attendance.');
    } finally {
      setAttendingMemberId(null);
    }
  };

  // Hero matched members for live pop-up
  const heroMatchedMembers = useMemo(() => {
    const q = heroSearchText.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((m) => {
        const full = (m.fullName || '').toLowerCase();
        const first = (m.firstName || '').toLowerCase();
        const last = (m.lastName || '').toLowerCase();
        const id = (m.memberId || '').toLowerCase();
        return full.includes(q) || first.includes(q) || last.includes(q) || id.includes(q);
      })
      .slice(0, 10);
  }, [heroSearchText, members]);

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
        'Being part of the MCGI Youth in the Local of Ascoville has kept my spiritual compass grounded. Having a clear and reliable check-in portal makes staying accountable to our gatherings effortless.',
      author: 'Bro. Joshua Ramos',
      role: 'Youth Choir Member · Local of Ascoville',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'The fellowship and Christian community across our locale inspire us to serve with joy. Checking our attendance and upcoming schedules has never been this smooth and dignified.',
      author: 'Sis. Andrea Santos',
      role: 'Teatro Kristiano · Local of Ascoville',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'As working youth, having transparent access to our prayer meeting schedules and thanksgiving records keeps us aligned with God’s work no matter how hectic school or work gets.',
      author: 'Bro. Mark Villanueva',
      role: 'Outreach Volunteer · Local of Ascoville',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote:
        'The dedication of our locale coordinators and secretariat is inspiring. This portal reflects genuine professionalism, orderliness, and Christian brotherhood.',
      author: 'Sis. Patricia Cruz',
      role: 'Secretariat Committee · Local of Ascoville',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
  ];

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonies.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonies.length) % testimonies.length);
  };

  // Sacred Gatherings (dynamic from config or defaults)
  const activeGatherings: GatheringItem[] = React.useMemo(() => {
    if (landingPageConfig?.gatherings && landingPageConfig.gatherings.length > 0) {
      return landingPageConfig.gatherings;
    }
    return [
      {
        id: 'gath-1',
        num: '01',
        title: 'Prayer Meeting',
        subtitle: 'Midweek Spiritual Edification',
        date: 'Every Wednesday & Thursday',
        desc: 'Regular midweek congregational gathering for deep prayer, biblical guidance, and strengthening of faith.',
        image:
          landingPageConfig?.gatheringImages?.prayerMeeting ||
          'https://images.unsplash.com/photo-1445445294270-ce521a0e50dc?auto=format&fit=crop&w=800&q=80',
        type: 'prayer_meeting',
      },
      {
        id: 'gath-2',
        num: '02',
        title: 'Worship Service',
        subtitle: 'Holy Sabbath Praise & Doctrine',
        date: 'Every Weekend (Saturday & Sunday)',
        desc: 'Reverent spiritual worship and doctrinal contemplation for all youth brethren and brethren in faith.',
        image:
          landingPageConfig?.gatheringImages?.worshipService ||
          'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=800&q=80',
        type: 'worship_service',
      },
      {
        id: 'gath-3',
        num: '03',
        title: 'Thanksgiving of God’s People',
        subtitle: 'Weekly Celebration of Grace',
        date: 'Sat (4:00pm) · Sun (5:00am) · Mon (8:30am)',
        desc: 'Congregational sacrifice of thanksgiving (Pasalamat) for God’s continuous mercy, protection, and guidance across 3 weekly batches.',
        image:
          landingPageConfig?.gatheringImages?.thanksgiving ||
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
        type: 'tgp',
      },
      {
        id: 'gath-4',
        num: '04',
        title: 'Youth Christian Fellowship',
        subtitle: 'KKTK Activities & Outreach',
        date: 'Monthly Gatherings & Missions',
        desc: 'Dynamic brotherhood events, charitable missions, bible studies, choir practice, and community service.',
        image:
          landingPageConfig?.gatheringImages?.fellowship ||
          'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
        type: 'special_event',
      },
    ];
  }, [landingPageConfig]);

  // Leadership Team (6 members)
  const committeeLeaders = [
    {
      name: 'Bro. Daniel Ramos',
      role: 'Ascoville Youth Coordinator',
      area: 'Local of Ascoville',
      experience: 'Youth Leadership · 8 Years in Service',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Abigail Mendoza',
      role: 'Ascoville Attendance Secretary',
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
      role: 'Ascoville Tech & IT Secretary',
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
              ASCOVILLE
            </span>
          </a>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-charcoal-800">
            <a href="#about" className="hover:text-bronze-600 transition">
              About Locale
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
                MCGI Youth · Local of Ascoville
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
                  'A vibrant spiritual community for youth brethren of the Local of Ascoville — built to nurture faith, service, and attendance diligence.'}
              </p>

              {/* Automated Active Gathering & Duty Assignment Card */}
              <div id="hero-attendance" className="mt-7 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 p-5 text-white max-w-2xl shadow-xl scroll-mt-28">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/15">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-bronze-500 text-charcoal-950 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-charcoal-950 animate-pulse"></span>
                      {isManualOverride ? 'Selected Gathering' : 'Today’s Gathering (Automated)'}
                    </span>
                    <span className="font-serif text-lg font-bold text-white">
                      {selectedGatheringSlot.eventName}
                    </span>
                  </div>

                  {/* Change Button / Choice of Gathering */}
                  <button
                    type="button"
                    onClick={() => setIsGatheringSelectorOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/25 text-cream-100 transition shadow-2xs cursor-pointer self-start sm:self-auto"
                    title="Change gathering or select another schedule batch"
                  >
                    <Calendar className="w-3.5 h-3.5 text-bronze-300" />
                    <span>Change Gathering ▾</span>
                  </button>
                </div>

                {/* Day, Time & Duty Details */}
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-bronze-300 tracking-wider block">
                      Schedule & Time
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 font-bold text-sm text-white">
                      <Clock className="w-3.5 h-3.5 text-bronze-400" />
                      <span>{selectedGatheringSlot.dayFullName} · {selectedGatheringSlot.time}</span>
                    </div>
                    {selectedGatheringSlot.hasZoom && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-300 font-semibold mt-1">
                        <Video className="w-3 h-3" /> w/ Zoom link
                      </span>
                    )}
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-bronze-300 tracking-wider block">
                      MPRO Incharge
                    </span>
                    <span className="font-semibold text-cream-100 block mt-0.5 text-xs">
                      {selectedGatheringSlot.mproIncharge}
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-bronze-300 tracking-wider block">
                      Officers Assigned
                    </span>
                    <span className="font-semibold text-cream-100 block mt-0.5 text-xs">
                      {selectedGatheringSlot.officersAssigned}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant Search Name & Auto-Present Attendance Widget */}
              <div className="mt-5 max-w-2xl relative">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={heroSearchText}
                      onChange={(e) => setHeroSearchText(e.target.value)}
                      placeholder="Type your name to attend (e.g. Agatha, Aljon, M-1001)..."
                      className="w-full pl-11 pr-10 py-3.5 text-sm font-medium bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl text-white placeholder-cream-300/70 focus:outline-none focus:ring-2 focus:ring-bronze-400 focus:bg-white/20 transition shadow-inner"
                    />
                    <Search className="w-4 h-4 text-cream-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {heroSearchText && (
                      <button
                        type="button"
                        onClick={() => setHeroSearchText('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream-300 hover:text-white p-1 cursor-pointer"
                        title="Clear input"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenSearchWithQuery(heroSearchText.trim())}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs uppercase tracking-widest font-bold rounded-2xl bg-bronze-500 hover:bg-bronze-400 text-charcoal-950 transition shrink-0 shadow-lg cursor-pointer"
                  >
                    <span>Search Roster</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Instant Live Matching Cards Pop-Up */}
                {heroSearchText.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden divide-y divide-stone-100 z-40 text-stone-900 animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto">
                    <div className="px-4 py-2.5 bg-amber-50/90 border-b border-amber-200/60 flex items-center justify-between text-xs sticky top-0 backdrop-blur-md z-10">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Tap "Attend" to auto-present for {selectedGatheringSlot.eventName} ({selectedGatheringSlot.time})
                      </span>
                      <span className="text-stone-500 text-[11px] font-semibold">
                        {heroMatchedMembers.length} match(es)
                      </span>
                    </div>

                    {heroMatchedMembers.length === 0 ? (
                      <div className="p-6 text-center text-stone-500 text-xs">
                        No member found matching "{heroSearchText}". Check your spelling or search by Member ID.
                      </div>
                    ) : (
                      heroMatchedMembers.map((member: Member) => {
                        const alreadyPresent = isMemberAttendedForActiveSlot(member.memberId);
                        const isProcessing = attendingMemberId === member.memberId;

                        return (
                          <div
                            key={member.memberId}
                            className="p-3.5 flex items-center justify-between gap-3 hover:bg-amber-50/40 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {member.firstName?.[0] || 'M'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-stone-900 truncate">
                                    {member.fullName}
                                  </h4>
                                  <span className="font-mono text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    {member.memberId}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-500 truncate">
                                  {member.memberCategory} Youth • {member.committees.join(', ') || 'Youth Member'}
                                </p>
                              </div>
                            </div>

                            {/* One-Click Auto-Present Button */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleQuickAttend(member)}
                                disabled={alreadyPresent || isProcessing}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                  alreadyPresent
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                                    : isProcessing
                                    ? 'bg-amber-400 text-amber-950 animate-pulse cursor-wait'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-102 cursor-pointer'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  {alreadyPresent
                                    ? '✓ Present (Recorded)'
                                    : isProcessing
                                    ? 'Recording...'
                                    : '✓ Attend (Mark Present)'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMember(member);
                                  setIsStatusOpen(true);
                                }}
                                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                                title="View attendance card"
                              >
                                Profile
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Quick Attendance Success Toast Notification */}
                {attendSuccessToast && (
                  <div className="mt-3 p-4 rounded-2xl bg-emerald-500 text-charcoal-950 shadow-2xl border-2 border-emerald-300 flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-950">
                          Attendance Auto-Recorded!
                        </p>
                        <p className="text-xs font-semibold text-charcoal-950">
                          {attendSuccessToast.memberName} is marked <strong>PRESENT</strong> for {attendSuccessToast.gatheringName} ({attendSuccessToast.time})! Synced with Google Sheets.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttendSuccessToast(null)}
                      className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {attendErrorToast && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-600 text-white text-xs flex items-center justify-between gap-2 shadow-lg">
                    <span>{attendErrorToast}</span>
                    <button onClick={() => setAttendErrorToast(null)} className="p-1 cursor-pointer">✕</button>
                  </div>
                )}
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
              <span>Members Church of God International · Local of Ascoville</span>
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
                The Locale Story
              </p>
              <p className="text-charcoal-800 text-base leading-relaxed font-normal">
                Rooted in deep Christian love, biblical sound doctrine, and tireless brotherhood, the MCGI Youth in the Local of Ascoville unites young brethren in fulfilling our divine calling to be the salt and light of the world.
              </p>
              <div className="img-hover-zoom rounded-2xl aspect-[4/3] bg-cream-200">
                <img
                  src={
                    landingPageConfig?.aboutImageUrl ||
                    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80'
                  }
                  alt="MCGI Youth Fellowship"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right 7 Cols: Big Heading + Button + Mission Statement */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-10">
              <div className="space-y-6">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-charcoal-950">
                  Vibrant fellowship helping youth brethren across the Local of Ascoville walk in spiritual integrity.
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
                  We maintain strict accountability and order in attendance recording, compassionate follow-up for on-and-off youth, and inspiring avenues for music, arts, and charitable missions in Ascoville.
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
              Join congregational services, midweek prayer meetings, and special youth gatherings scheduled at the Local of Ascoville.
            </p>
          </div>

          {/* 4-Card Practice Grid */}
          {/* Dynamic Gathering Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeGatherings.map((g, i) => {
              // Find matching real event from data if available
              const matchedEvent = events.find(
                (e) =>
                  e.eventId === g.linkedEventId ||
                  e.eventType === g.type ||
                  e.eventName.toLowerCase().includes(g.title.toLowerCase())
              );
              return (
                <div
                  key={g.id || i}
                  className="group relative rounded-2xl overflow-hidden bg-charcoal-900 min-h-[480px] flex flex-col justify-end p-6 img-hover-zoom border border-white/5 hover:border-bronze-400/40 transition duration-300"
                >
                  <img
                    src={g.image || matchedEvent?.eventImage || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80'}
                    alt={g.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/60 to-transparent"></div>
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs uppercase tracking-widest text-bronze-400 font-bold">
                        {g.num || String(i + 1).padStart(2, '0')}
                      </span>
                      {g.date && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-charcoal-900/85 backdrop-blur-md text-amber-300 border border-amber-400/30">
                          <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{g.date}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-2xl text-white font-normal leading-snug">
                      {g.title}
                    </h3>
                    {g.subtitle && (
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-bronze-400/90">
                        {g.subtitle}
                      </p>
                    )}
                    <p className="text-cream-200/70 text-xs font-light leading-relaxed line-clamp-3">
                      {g.desc || matchedEvent?.description}
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

          {/* Official Locale Schedule & Officer Duty Roster */}
          <div className="mt-14 bg-white rounded-3xl border border-cream-300 shadow-sm overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cream-200">
              <div>
                <span className="text-[11px] uppercase tracking-widest font-extrabold text-bronze-600 block mb-1">
                  Official Locale Regular Schedule & Duty Assignment
                </span>
                <h3 className="font-serif text-2xl text-charcoal-950 font-normal">
                  Prayer Meeting & Worship Service Roster
                </h3>
                <p className="text-xs text-charcoal-600 mt-1">
                  Officers and MPRO assignees for each batch. Click any schedule to set it for attendance check-in.
                </p>
              </div>

              {/* Tabs */}
              <div className="inline-flex rounded-xl bg-cream-200/60 p-1 border border-cream-300 text-xs font-semibold self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setScheduleFilterTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    scheduleFilterTab === 'ALL'
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'text-charcoal-700 hover:text-charcoal-950'
                  }`}
                >
                  All Batches
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilterTab('PM')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    scheduleFilterTab === 'PM'
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'text-charcoal-700 hover:text-charcoal-950'
                  }`}
                >
                  Prayer Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilterTab('WS')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    scheduleFilterTab === 'WS'
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'text-charcoal-700 hover:text-charcoal-950'
                  }`}
                >
                  Worship Service
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilterTab('TG')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    scheduleFilterTab === 'TG'
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'text-charcoal-700 hover:text-charcoal-950'
                  }`}
                >
                  Thanksgiving
                </button>
              </div>
            </div>

            {/* Schedule List / Table */}
            <div className="mt-6 divide-y divide-cream-200">
              {LOKAL_REGULAR_SCHEDULES.filter((slot) => {
                if (scheduleFilterTab === 'PM') return slot.eventType === 'Prayer Meeting';
                if (scheduleFilterTab === 'WS') return slot.eventType === 'Worship Service';
                if (scheduleFilterTab === 'TG') return slot.eventType === 'Thanksgiving';
                return true;
              }).map((slot) => {
                const isCurrentActive = selectedGatheringSlot.slotId === slot.slotId;
                return (
                  <div
                    key={slot.slotId}
                    className={`py-4 px-3 sm:px-4 rounded-xl transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isCurrentActive
                        ? 'bg-amber-50/80 border border-amber-300/80 shadow-xs'
                        : 'hover:bg-cream-100/60'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-center font-bold ${
                          slot.eventType === 'Prayer Meeting'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : slot.eventType === 'Worship Service'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold">{slot.dayName}</span>
                        <span className="text-xs font-black">{slot.time.split(' ')[0]}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-charcoal-950 text-base">
                            {slot.eventName}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cream-200 text-charcoal-700">
                            {slot.dayFullName} · {slot.time}
                          </span>
                          {slot.hasZoom && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              <Video className="w-3 h-3 text-blue-600" />
                              w/ Zoom
                            </span>
                          )}
                          {isCurrentActive && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full animate-pulse">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active in Check-In
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal-700">
                          <div>
                            <span className="font-bold text-bronze-700">MPRO Incharge: </span>
                            <span className="text-charcoal-900 font-medium">{slot.mproIncharge}</span>
                          </div>
                          <div>
                            <span className="font-bold text-bronze-700">Officers Assigned: </span>
                            <span className="text-charcoal-900 font-medium">{slot.officersAssigned}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectSlotFromSchedule(slot)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isCurrentActive
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                            : 'bg-charcoal-900 text-white hover:bg-bronze-600 shadow-xs'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isCurrentActive ? 'Selected (Check In)' : 'Select & Check-In'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
                src={
                  landingPageConfig?.processImageUrl ||
                  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
                }
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
                  Confirm your identity securely. View your committee memberships, attendance rate, registered locale, and active status in the Local of Ascoville.
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
              Elders, youth officers, and ministry coordinators committed to assisting brethren in the Local of Ascoville.
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
                Reflections and affirmations from active youth members serving in the Local of Ascoville.
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
      {landingPageConfig?.showAnnouncements !== false && (
        <section id="announcements" className="py-24 border-b border-cream-300">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-bronze-600 mb-2">
                  {landingPageConfig?.announcementsSubtitle || 'Perspectives & Circulars'}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl text-charcoal-950 font-normal">
                  {landingPageConfig?.announcementsTitle || 'Digital Announcement Board.'}
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
            {(() => {
              const activeAnnouncements = announcements
                .filter((a) => a.status !== 'Archived')
                .sort((a, b) => {
                  if (a.announcementId === landingPageConfig?.featuredAnnouncementId) return -1;
                  if (b.announcementId === landingPageConfig?.featuredAnnouncementId) return 1;
                  if (a.featured && !b.featured) return -1;
                  if (!a.featured && b.featured) return 1;
                  return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                })
                .slice(0, landingPageConfig?.announcementsLimit || 4);

              if (activeAnnouncements.length === 0) {
                return (
                  <div className="text-center py-16 bg-cream-50 rounded-2xl border border-cream-200 p-8">
                    <p className="font-serif text-lg text-charcoal-800">No active circulars at this moment.</p>
                    <p className="text-xs text-charcoal-800/60 mt-1">Please check back soon for upcoming youth bulletins.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {activeAnnouncements.map((ann, idx) => (
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
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

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
                Members Church of God International Youth Fellowship — Local of Ascoville. Nurturing faith, fellowship, and diligent Christian stewardship among our youth brethren.
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
                    About Locale
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

            {/* Locale Ministries & Committees */}
            <div className="lg:col-span-3 space-y-4">
              <h5 className="text-xs uppercase tracking-widest font-semibold text-bronze-400">
                Locale Ministries & Committees
              </h5>
              <ul className="space-y-2 text-xs font-light text-cream-300/80">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Youth Choir & Music Ministry
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Teatro Kristiano & Creative Arts
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Secretariat & Attendance Records
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Charity, Community & Outreach Volunteers
                </li>
              </ul>
            </div>

            {/* Administration & Officer Portal */}
            <div className="lg:col-span-3 space-y-4">
              <h5 className="text-xs uppercase tracking-widest font-semibold text-bronze-400">
                Administration
              </h5>
              <p className="text-xs font-light text-cream-300/70">
                Are you a designated youth officer, committee head, or locale administrator?
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
              &copy; {new Date().getFullYear()} MCGI Youth Local of Ascoville. To God Be The Glory.
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
        activeGatheringTitle={`${selectedGatheringSlot.eventName} (${selectedGatheringSlot.time})`}
        onQuickAttend={handleQuickAttend}
        isAlreadyAttended={isMemberAttendedForActiveSlot}
      />

      {/* Choice of Gathering Selector Modal */}
      <GatheringSelectorModal
        isOpen={isGatheringSelectorOpen}
        onClose={() => setIsGatheringSelectorOpen(false)}
        selectedSlot={selectedGatheringSlot}
        onSelectSlot={(slot, isManual) => {
          setSelectedGatheringSlot(slot);
          setIsManualOverride(isManual);
          if (slot.dayOfWeek === new Date().getDay()) {
            setSelectedGatheringDate(formatDateYYYYMMDD(new Date()));
          } else {
            const today = new Date();
            const diff = (slot.dayOfWeek - today.getDay() + 7) % 7 || 7;
            const nextDate = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
            setSelectedGatheringDate(formatDateYYYYMMDD(nextDate));
          }
        }}
        isManualOverride={isManualOverride}
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

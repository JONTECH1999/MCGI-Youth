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
  X,
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
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Member } from '../types/member';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { Announcement } from '../types/announcement';
import { GatheringItem } from '../types/landingPage';
import { COMMITTEE_METADATA } from '../data/sampleCommittees';
import {
  RegularGatheringSlot,
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
import { AnnouncementBoard } from '../components/landing/AnnouncementBoard';
import { EventCheckInModal } from '../components/landing/EventCheckInModal';
import { AdminLoginModal } from '../components/landing/AdminLoginModal';
import { GatheringSelectorModal } from '../components/landing/GatheringSelectorModal';

interface LandingPageProps {
  onEnterAdmin: () => void;
}

interface HeroCardDragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
  baseLeft: number;
  baseTop: number;
  width: number;
  height: number;
  bounds: DOMRect;
  moved: boolean;
}

interface FloatingSearchDragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  moved: boolean;
}

interface CommitteeRosterMember {
  name: string;
  image: string;
  isContactPerson?: boolean;
}

interface YouthCommitteeCard {
  name: string;
  alias: string;
  description: string;
  image: string;
  members: CommitteeRosterMember[];
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

  const fallbackHeroImage = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1920&q=80';
  const heroSlides = landingPageConfig?.heroImages?.filter(Boolean).length
    ? landingPageConfig.heroImages.filter(Boolean)
    : [landingPageConfig?.heroImageUrl || fallbackHeroImage];
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const heroSurfaceRef = useRef<HTMLDivElement>(null);
  const heroCardOffsetRef = useRef({ x: 0, y: 0 });
  const heroCardDragRef = useRef<HeroCardDragState | null>(null);
  const suppressHeroCardClickRef = useRef(false);
  const [isHeroCardDragging, setIsHeroCardDragging] = useState(false);

  const handleHeroCardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const surface = heroSurfaceRef.current;
    if (!surface) return;

    const cardRect = event.currentTarget.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    const offset = heroCardOffsetRef.current;
    heroCardDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      baseLeft: cardRect.left - offset.x,
      baseTop: cardRect.top - offset.y,
      width: cardRect.width,
      height: cardRect.height,
      bounds: surfaceRect,
      moved: false,
    };
  };

  const handleHeroCardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = heroCardDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;

    if (!drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsHeroCardDragging(true);
    }
    event.preventDefault();

    const minX = drag.bounds.left + 12 - drag.baseLeft;
    const maxX = drag.bounds.right - 12 - drag.baseLeft - drag.width;
    const minY = drag.bounds.top + 12 - drag.baseTop;
    const maxY = drag.bounds.bottom - 12 - drag.baseTop - drag.height;
    const x = Math.max(minX, Math.min(maxX, drag.startOffsetX + deltaX));
    const y = Math.max(minY, Math.min(maxY, drag.startOffsetY + deltaY));
    heroCardOffsetRef.current = { x, y };
    event.currentTarget.style.translate = `${x}px ${y}px`;
  };

  const finishHeroCardPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = heroCardDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressHeroCardClickRef.current = true;
      window.setTimeout(() => {
        suppressHeroCardClickRef.current = false;
      }, 0);
    }
    heroCardDragRef.current = null;
    setIsHeroCardDragging(false);
  };

  const handleHeroCardClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressHeroCardClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressHeroCardClickRef.current = false;
  };

  useEffect(() => {
    setHeroImageIndex((index) => index % heroSlides.length);
    if (heroSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroImageIndex((index) => (index + 1) % heroSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

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
  const [selectedCommitteeName, setSelectedCommitteeName] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCommitteeName) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedCommitteeName(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedCommitteeName]);

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
  const [isGatheringCardMinimized, setIsGatheringCardMinimized] = useState(false);
  const [floatingSearchPosition, setFloatingSearchPosition] = useState({ x: 0, y: 0 });
  const [isGatheringSelectorOpen, setIsGatheringSelectorOpen] = useState<boolean>(false);
  const floatingSearchInitializedRef = useRef(false);
  const floatingSearchDragRef = useRef<FloatingSearchDragState | null>(null);
  const suppressFloatingSearchClickRef = useRef(false);

  const handleMinimizeGatheringCard = () => {
    if (!floatingSearchInitializedRef.current) {
      setFloatingSearchPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      floatingSearchInitializedRef.current = true;
    }
    setIsGatheringCardMinimized(true);
  };

  const handleFloatingSearchPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    floatingSearchDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: floatingSearchPosition.x,
      startY: floatingSearchPosition.y,
      moved: false,
    };
  };

  const handleFloatingSearchPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = floatingSearchDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;

    if (!drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();

    const margin = 44;
    const minX = Math.min(margin, window.innerWidth / 2);
    const maxX = Math.max(window.innerWidth - margin, window.innerWidth / 2);
    const minY = Math.min(margin, window.innerHeight / 2);
    const maxY = Math.max(window.innerHeight - margin, window.innerHeight / 2);
    setFloatingSearchPosition({
      x: Math.max(minX, Math.min(maxX, drag.startX + deltaX)),
      y: Math.max(minY, Math.min(maxY, drag.startY + deltaY)),
    });
  };

  const finishFloatingSearchPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = floatingSearchDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressFloatingSearchClickRef.current = true;
      window.setTimeout(() => {
        suppressFloatingSearchClickRef.current = false;
      }, 0);
    }
    floatingSearchDragRef.current = null;
  };

  const handleFloatingSearchClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressFloatingSearchClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressFloatingSearchClickRef.current = false;
  };

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

  const handleSelectRegularSlotForCheckIn = (slot: RegularGatheringSlot) => {
    const now = new Date();
    const [hours, minutes] = slot.time24.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let daysUntilSlot = (slot.dayOfWeek - now.getDay() + 7) % 7;

    if (daysUntilSlot === 0 && hours * 60 + minutes <= currentMinutes) {
      daysUntilSlot = 7;
    }

    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSlot);
    setSelectedGatheringSlot(slot);
    setSelectedGatheringDate(formatDateYYYYMMDD(scheduledDate));
    setIsManualOverride(true);
    setInitialSearchQuery(activeMember?.fullName || '');
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

  // Sacred Gatherings (dynamic from config or defaults)
  const activeGatherings: GatheringItem[] = React.useMemo(() => {
    const configuredGatherings = landingPageConfig?.gatherings?.filter(
      (gathering) => gathering.title !== 'Youth Christian Fellowship'
    );
    if (configuredGatherings?.length) {
      return configuredGatherings;
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
    ];
  }, [landingPageConfig]);

  // Ascoville Youth Officer Lineup
  const committeeLeaders = [
    {
      name: 'Bro. Aljon Alonzo',
      role: 'President',
      area: 'Executive Board',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bro. Dhave Tuliao',
      role: 'VP Internal',
      area: 'Executive Board',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bro. Exur Gundaya',
      role: 'VP External',
      area: 'Executive Board',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Careline M. Igay',
      role: 'Admin Records',
      area: 'Administration',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Florwyn Nicole Formilleza',
      role: 'Admin Membership',
      area: 'Administration',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Jaira',
      role: 'Admin Communication',
      area: 'Administration',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bro. Eman Sumawang',
      role: 'Finance Treasurer',
      area: 'Finance',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Angelica Alborte',
      role: 'Finance Auditor',
      area: 'Finance',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Hyacinth Tomias',
      role: 'Finance Auditor',
      area: 'Finance',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bro. Earl John Oasan',
      role: 'Project Coordinator',
      area: 'Projects',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bro. Vincent Nuñez',
      role: 'Operations - Events',
      area: 'Operations',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Position Open',
      role: 'Operations - Media Tech',
      area: 'Operations',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Madel Sabandeja',
      role: 'Operations - SocMed',
      area: 'Operations',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Sis. Celestina Igay',
      role: 'Operations - Editor',
      area: 'Operations',
      experience: 'Local of Ascoville',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const youthCommittees: YouthCommitteeCard[] = [
    {
      name: 'Guest Coordinators',
      alias: 'GCOS',
      description: COMMITTEE_METADATA['Guest Coordinators'].description,
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
      members: [
        { name: 'Sis. Sharmaine', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80', isContactPerson: true },
        { name: 'Bro. Aljon', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80' },
        { name: 'Bro. David', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80' },
        { name: 'Bro. Christian', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80' },
        { name: 'Bro. Leander', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80' },
        { name: 'Sis. Leslie', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80' },
        { name: 'Sis. Nathalie', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80' },
        { name: 'Sis. Jasmine', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80' },
        { name: 'Sis. Princess', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80' },
      ],
    },
    {
      name: 'Teatro Kristiano',
      alias: 'TK',
      description: COMMITTEE_METADATA['Teatro Kristiano'].description,
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
      members: [
        { name: 'Bro. Dhave Tuliao', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80', isContactPerson: true },
        { name: 'Sis. Jaira', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80' },
        { name: 'Sis. Careline', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80' },
        { name: 'Sis. Angelica', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80' },
        { name: 'Sis. Florwyn', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80' },
        { name: 'Sis. Genna', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80' },
      ],
    },
    {
      name: 'Choir',
      alias: 'Music Ministry',
      description: COMMITTEE_METADATA['Music Ministry'].description,
      image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
      members: [],
    },
    {
      name: 'Artist Guild',
      alias: 'AG',
      description: COMMITTEE_METADATA['Artist Guild'].description,
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
      members: [],
    },
  ];
  const selectedYouthCommittee = youthCommittees.find(
    (committee) => committee.name === selectedCommitteeName
  );

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

          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 text-sm font-medium text-charcoal-800">
            <a href="#announcements" className="hover:text-bronze-600 transition">
              Announcements
            </a>
            <a href="#gatherings" className="hover:text-bronze-600 transition">
              Gatherings
            </a>
            <a href="#leadership" className="hover:text-bronze-600 transition">
              Youth Officers
            </a>
            <a href="#youth-committees" className="hover:text-bronze-600 transition">
              Youth Committees
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
            <button
              type="button"
              onClick={() => setIsAdminLoginOpen(true)}
              title="Officer Portal Login"
              aria-label="Officer Portal Login"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-bronze-500 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-charcoal-950 transition hover:bg-bronze-400"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Officer Portal Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section matching Leagally */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div ref={heroSurfaceRef} className="relative rounded-[2rem] overflow-hidden bg-charcoal-950 text-white min-h-[600px] md:min-h-[680px] flex flex-col justify-between p-6 sm:p-9 md:p-12 lg:p-16 shadow-[0_28px_80px_-32px_rgba(24,23,22,0.65)] ring-1 ring-charcoal-800/10">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
              {heroSlides.map((image, index) => (
                <img
                  key={`${index}-${image.slice(0, 32)}`}
                  src={image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 motion-reduce:transition-none"
                  style={{ opacity: index === heroImageIndex ? 1 : 0 }}
                  onError={(event) => {
                    event.currentTarget.src = fallbackHeroImage;
                  }}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/55 via-charcoal-950/20 to-charcoal-950/5"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/45 via-transparent to-charcoal-950/5"></div>
            </div>

            {/* Center Content */}
            {!isGatheringCardMinimized && (
            <div
              className={`relative z-10 mx-auto max-w-[460px] w-full my-auto rounded-2xl bg-charcoal-950/10 backdrop-blur-md border border-white/50 p-4 sm:p-5 md:p-6 shadow-2xl shadow-black/20 cursor-grab ${isHeroCardDragging ? 'cursor-grabbing' : ''}`}
              role="group"
              aria-label="Gathering and member search card. Hold and drag to move."
              title="Hold and drag to move this card"
              style={{ touchAction: 'none', translate: `${heroCardOffsetRef.current.x}px ${heroCardOffsetRef.current.y}px` }}
              onPointerDown={handleHeroCardPointerDown}
              onPointerMove={handleHeroCardPointerMove}
              onPointerUp={finishHeroCardPointer}
              onPointerCancel={finishHeroCardPointer}
              onClickCapture={handleHeroCardClickCapture}
            >

              {/* Automated Active Gathering & Duty Assignment Card */}
              <div id="hero-attendance" className="w-full text-white scroll-mt-28">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/80">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                      {isManualOverride ? 'Selected Gathering' : 'Today’s Gathering (Automated)'}
                    </p>
                    <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold leading-tight text-white">
                      {selectedGatheringSlot.eventName}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsGatheringSelectorOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/30 text-white transition cursor-pointer"
                      title="Change gathering or select another schedule batch"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Change Gathering</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleMinimizeGatheringCard}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-white bg-white/10 hover:bg-white/20 border border-white/30 transition cursor-pointer"
                      title="Minimize gathering card"
                      aria-label="Minimize gathering card"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day, Time & Duty Details */}
                <div className="mt-4 pt-4 border-t border-white/25 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-white/75 tracking-[0.12em] block">
                      Schedule & Time
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 font-semibold text-sm text-white leading-snug">
                      <Clock className="w-3.5 h-3.5 text-white/80 shrink-0" />
                      <span>{selectedGatheringSlot.dayFullName} · {selectedGatheringSlot.time}</span>
                    </div>
                    {selectedGatheringSlot.hasZoom && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-white/85 font-semibold mt-1">
                        <Video className="w-3 h-3" /> w/ Zoom link
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-white/75 tracking-[0.12em] block">
                      MPRO Incharge
                    </span>
                    <span className="font-semibold text-white block mt-1 text-xs leading-relaxed">
                      {selectedGatheringSlot.mproIncharge}
                    </span>
                  </div>

                  <div className="min-w-0 sm:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-white/75 tracking-[0.12em] block">
                      Officers Assigned
                    </span>
                    <span className="font-semibold text-white block mt-1 text-xs leading-relaxed">
                      {selectedGatheringSlot.officersAssigned}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant Search Name & Auto-Present Attendance Widget */}
              <div className="relative search-attention mt-4 pt-4 border-t border-white/25">
                <div className="relative">
                    <span
                      aria-hidden="true"
                      className="search-notification-dot absolute -top-1.5 -right-1.5 z-10 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white shadow-md"
                    />
                    <input
                      id="hero-member-search"
                      type="text"
                      aria-label="Search by member name or ID"
                      value={heroSearchText}
                      onChange={(e) => setHeroSearchText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleOpenSearchWithQuery(heroSearchText.trim());
                        }
                      }}
                      placeholder="Enter your name or Member ID..."
                      className="search-attention-input w-full pl-11 pr-10 py-3.5 text-sm font-medium bg-charcoal-950/35 backdrop-blur-md border border-white/45 rounded-xl text-white placeholder:text-white/85 focus:outline-none focus:ring-2 focus:ring-bronze-300 focus:border-bronze-300/70 focus:bg-charcoal-950/55 transition shadow-inner"
                    />
                    <Search className="w-4 h-4 text-white/85 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                            className="p-3.5 flex flex-col gap-2.5 hover:bg-amber-50/40 transition"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {member.firstName?.[0] || 'M'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-stone-900 whitespace-normal break-words leading-snug">
                                  {member.fullName}
                                </h4>
                                <p className="text-[11px] text-stone-500 whitespace-normal break-words mt-0.5">
                                  {member.memberCategory} Youth • {member.committees.join(', ') || 'Youth Member'}
                                </p>
                              </div>
                            </div>

                            {/* One-Click Auto-Present Button */}
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuickAttend(member)}
                                disabled={alreadyPresent || isProcessing}
                                className={`inline-flex flex-1 max-w-max items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
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
                                className="shrink-0 px-2.5 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
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

            </div>
            )}

            {/* Bottom Exploration Bar */}
            <div className="relative z-10 pt-5 mt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-cream-200/70 font-light gap-3">
              <span className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15"></span>
                Official Google Sheets Database Active & Synchronized
              </span>
              <span>Members Church of God International · Local of Ascoville</span>
            </div>
          </div>
        </div>
      </section>

      {landingPageConfig?.showAnnouncements !== false && (
        <AnnouncementBoard
          announcements={announcements}
          onSelectAnnouncement={setSelectedAnnouncement}
          title={landingPageConfig?.announcementsTitle || 'Digital Announcement Board.'}
          subtitle={landingPageConfig?.announcementsSubtitle || 'Stay in the loop with pastoral reminders, upcoming youth activities, service guidelines, and local assemblies.'}
          limit={landingPageConfig?.announcementsLimit || 4}
          featuredAnnouncementId={landingPageConfig?.featuredAnnouncementId}
        />
      )}

      {/* Practice Areas Grid (Section 3 - Sacred Gatherings) matching Leagally */}
      <section id="gatherings" className="py-24 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal-950 font-normal">
                Regular Weekly Gatherings
              </h2>
          </div>

          {/* Dynamic Gathering Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {activeGatherings.map((g, i) => {
              const hidePrimaryGatheringCopy = [
                'Prayer Meeting',
                'Worship Service',
                'Thanksgiving of God’s People',
              ].includes(g.title);
              const gatheringEventType: AttendanceEvent['eventType'] | undefined =
                g.type === 'prayer_meeting'
                  ? 'Prayer Meeting'
                  : g.type === 'worship_service'
                  ? 'Worship Service'
                  : g.type === 'tgp' || g.type === 'thanksgiving'
                  ? 'Thanksgiving'
                  : undefined;
              // Find matching real event from data if available
              const matchedEvent = events.find(
                (e) =>
                  e.eventId === g.linkedEventId ||
                  e.eventType === gatheringEventType ||
                  e.eventName.toLowerCase().includes(g.title.toLowerCase())
              );
              return (
                <div
                  key={g.id || i}
                  className="group relative h-full min-h-[460px] rounded-2xl overflow-hidden bg-charcoal-900 flex flex-col justify-end p-6 img-hover-zoom border border-white/5 hover:border-bronze-400/40 transition duration-300"
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
                    {!hidePrimaryGatheringCopy && g.subtitle && (
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-bronze-400/90">
                        {g.subtitle}
                      </p>
                    )}
                    {!hidePrimaryGatheringCopy && (g.desc || matchedEvent?.description) && (
                      <p className="text-cream-200/70 text-xs font-light leading-relaxed line-clamp-3">
                        {g.desc || matchedEvent?.description}
                      </p>
                    )}
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

      {/* Team Showcase (Section 5 - Youth Leadership) matching Leagally */}
      <section id="leadership" className="py-24 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-charcoal-950 font-normal">
              Local Youth Officers
            </h2>
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

      <section id="youth-committees" className="py-20 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal-950 font-normal">
              Youth Committees
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {youthCommittees.map((committee) => (
                <article
                  key={committee.name}
                  className="group overflow-hidden rounded-2xl bg-cream-200 border border-cream-300 transition hover:shadow-lg"
                >
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`View ${committee.name} members`}
                    onClick={() => setSelectedCommitteeName(committee.name)}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="h-40 overflow-hidden bg-charcoal-900">
                      <img
                        src={committee.image}
                        alt={committee.name}
                        onError={(event) => {
                          event.currentTarget.src = fallbackHeroImage;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-4 bg-cream-50 space-y-1.5">
                      <span className="text-[10px] uppercase tracking-widest text-bronze-600 font-semibold">
                        {committee.alias}
                      </span>
                      <h3 className="font-serif text-lg text-charcoal-950 font-normal leading-snug">
                        {committee.name}
                      </h3>
                      <p className="text-charcoal-800 text-xs font-light leading-relaxed line-clamp-3">
                        {committee.description}
                      </p>
                      <span className="flex items-center justify-between pt-2 mt-2 border-t border-cream-200 text-[10px] uppercase tracking-wider font-bold text-charcoal-700">
                        <span>{committee.members.length ? `${committee.members.length} members` : 'No members listed'}</span>
                        <span className="inline-flex items-center gap-1 text-bronze-700">
                          View members <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </span>
                    </div>
                  </button>
                </article>
            ))}
          </div>
        </div>
      </section>

      {selectedYouthCommittee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="committee-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedCommitteeName(null)}
        >
          <div
            className="w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-2xl bg-cream-50 shadow-2xl border border-cream-300 animate-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-5 border-b border-cream-300 bg-white px-6 py-5 sm:px-8">
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-widest text-bronze-700">
                  {selectedYouthCommittee.alias}
                </span>
                <h2 id="committee-dialog-title" className="mt-1 font-serif text-2xl sm:text-3xl text-charcoal-950">
                  {selectedYouthCommittee.name}
                </h2>
                <p className="mt-1 text-sm text-charcoal-700">{selectedYouthCommittee.description}</p>
              </div>
              <button
                type="button"
                aria-label="Close committee members"
                onClick={() => setSelectedCommitteeName(null)}
                className="shrink-0 rounded-lg p-2 text-charcoal-600 hover:bg-cream-200 hover:text-charcoal-950 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[calc(88vh-120px)] overflow-y-auto p-5 sm:p-8">
              {selectedYouthCommittee.members.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedYouthCommittee.members.map((member) => (
                    <article key={member.name} className="flex items-center gap-4 rounded-xl border border-cream-300 bg-white p-4 shadow-sm">
                      <img
                        src={member.image}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <h3 className="font-serif text-lg leading-snug text-charcoal-950">{member.name}</h3>
                        {member.isContactPerson && (
                          <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                            Contact person
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-cream-400 bg-white px-5 py-8 text-center text-sm text-charcoal-600">
                  No members listed yet.
                </p>
              )}
            </div>
          </div>
        </div>
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
                Members Church of God International _ Local of Ascoville.
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
                  <a href="#announcements" className="hover:text-white transition">
                    Announcements
                  </a>
                </li>
                <li>
                  <a href="#gatherings" className="hover:text-white transition">
                    Sacred Gatherings
                  </a>
                </li>
                <li>
                  <a href="#leadership" className="hover:text-white transition">
                    Youth Officers
                  </a>
                </li>
                <li>
                  <a href="#youth-committees" className="hover:text-white transition">
                    Youth Committees
                  </a>
                </li>
              </ul>
            </div>

            {/* Local Youth Committees */}
            <div className="lg:col-span-3 space-y-4">
              <h5 className="text-xs uppercase tracking-widest font-semibold text-bronze-400">
                Local Youth Committees
              </h5>
              <ul className="space-y-2 text-xs font-light text-cream-300/80">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Guest Coordinators (GCOS) · Sis. Sharmaine
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Teatro Kristiano (TK) · Bro. Dhave Tuliao
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Choir / Music Ministry
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bronze-500"></span>
                  Artist Guild (AG)
                </li>
              </ul>
            </div>

            {/* Administration & Officer Portal */}
            <div className="lg:col-span-3 space-y-4">
              <h5 className="text-xs uppercase tracking-widest font-semibold text-bronze-400">
                Administration
              </h5>
              <p className="text-xs font-light text-cream-300/70">
                Authorized Local Youth Officers and committee coordinators can sign in to manage records.
              </p>
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

      {isGatheringCardMinimized && (
        <div
          className="fixed z-40 h-16 w-16 cursor-grab active:cursor-grabbing"
          style={{ left: floatingSearchPosition.x, top: floatingSearchPosition.y, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
          onPointerDown={handleFloatingSearchPointerDown}
          onPointerMove={handleFloatingSearchPointerMove}
          onPointerUp={finishFloatingSearchPointer}
          onPointerCancel={finishFloatingSearchPointer}
          onClickCapture={handleFloatingSearchClickCapture}
        >
          <button
            type="button"
            onClick={() => handleOpenSearchWithQuery('')}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 bg-charcoal-950 text-white shadow-xl shadow-black/30 transition hover:scale-105 hover:bg-bronze-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bronze-300"
            title="Search members"
            aria-label="Search members"
          >
            <Search className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setIsGatheringCardMinimized(false)}
            className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-bronze-500 text-charcoal-950 shadow-md transition hover:bg-bronze-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze-300"
            title="Restore gathering card"
            aria-label="Restore gathering card"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
        isOpen={isStatusOpen}
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
        onSelectRegularSlot={handleSelectRegularSlotForCheckIn}
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

import { Member } from '../types/member';
import { AttendanceRecord } from '../types/attendance';
import { AttendanceEvent } from '../types/event';
import { DemographicStatistics, MembershipStatistics, AttendanceAnalytics } from '../types/statistics';
import { OFFICIAL_COMMITTEES, normalizeCommitteeName } from '../data/sampleCommittees';

export const StatsService = {
  localDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Helper: check if member belongs to Junior bracket (14 to 24 years old)
   * or Senior bracket (25 years old & above)
   */
  isJuniorAge(m: Member): boolean {
    if (m.age !== undefined && m.age > 0) {
      return m.age >= 14 && m.age <= 24;
    }
    return m.memberCategory === 'Junior';
  },

  /**
   * Calculate live Membership Statistics conforming to official MCGI Youth reporting format
   */
  calculateMembershipStatistics(members: Member[]): MembershipStatistics {
    const stats: MembershipStatistics = {
      totalRegisteredMembers: members.length,
      active: { total: 0, junior: 0, senior: 0 },
      onAndOff: { total: 0, junior: 0, senior: 0 },
      inactive: { total: 0, junior: 0, senior: 0 },
      suspended: { total: 0, activeSuspended: 0, onAndOffSuspended: 0, inactiveRfa: 0 },
      bilangNgNapatawad: 0,
      missing: 0,
      nbbYouth: {
        overallTotal: 0,
        june: 0,
        july: 0,
        august: 0,
        quarterLabel: '2nd Quarter',
      },
    };

    members.forEach((m) => {
      const isJunior = this.isJuniorAge(m);

      // Membership Status Breakdown
      switch (m.membershipStatus) {
        case 'Active':
          stats.active.total++;
          if (isJunior) stats.active.junior++;
          else stats.active.senior++;
          break;

        case 'On & Off':
          stats.onAndOff.total++;
          if (isJunior) stats.onAndOff.junior++;
          else stats.onAndOff.senior++;
          break;

        case 'Inactive':
          stats.inactive.total++;
          if (isJunior) stats.inactive.junior++;
          else stats.inactive.senior++;
          break;

        case 'Suspended':
          stats.suspended.total++;
          if (m.suspensionCategory === 'Active Suspended' || m.activityStatus === 'Active' || m.activityStatus === 'Regular') {
            stats.suspended.activeSuspended++;
          } else if (m.suspensionCategory === 'On & Off Suspended' || m.activityStatus === 'At Risk') {
            stats.suspended.onAndOffSuspended++;
          } else {
            stats.suspended.inactiveRfa++;
          }
          break;

        case 'Missing':
          stats.missing++;
          break;
      }

      // Bilang ng Napatawad (Restored / Forgiven)
      if (m.isForgiven || (m.notes && m.notes.toLowerCase().includes('napatawad'))) {
        stats.bilangNgNapatawad++;
      }

      // NBB Youth (Newly Baptized Brethren - 2nd Quarter: June, July, August)
      const isNbb =
        m.isNBB ||
        (m.notes && m.notes.toLowerCase().includes('nbb')) ||
        (m.baptismDate && (m.baptismDate.includes('-06-') || m.baptismDate.includes('-07-') || m.baptismDate.includes('-08-'))) ||
        (m.dateRegistered && (m.dateRegistered.includes('-06-') || m.dateRegistered.includes('-07-') || m.dateRegistered.includes('-08-')));

      if (isNbb) {
        stats.nbbYouth.overallTotal++;
        const targetDate = m.baptismDate || m.dateRegistered || '';
        const monthNum = targetDate ? new Date(targetDate).getMonth() : -1;
        const nbbMonth = m.nbbMonth ? m.nbbMonth.toLowerCase() : '';

        if (nbbMonth === 'june' || monthNum === 5) {
          stats.nbbYouth.june++;
        } else if (nbbMonth === 'july' || monthNum === 6) {
          stats.nbbYouth.july++;
        } else if (nbbMonth === 'august' || monthNum === 7) {
          stats.nbbYouth.august++;
        } else {
          stats.nbbYouth.june++;
        }
      }
    });

    return stats;
  },

  /**
   * Calculate live Demographic Statistics
   */
  calculateDemographicStatistics(members: Member[]): DemographicStatistics {
    const stats: DemographicStatistics = {
      age: { junior: 0, senior: 0 },
      education: { totalStudents: 0, workingStudents: 0, outOfSchoolYouth: 0 },
      employment: { youthWithWork: 0, notWorking: 0 },
      voting: { registeredVoters: 0, notRegistered: 0 },
      parentStatus: { bothParents: 0, motherOnly: 0, fatherOnly: 0, unbaptizedParents: 0 },
      committees: {},
      withCommitteeTotal: 0,
      withoutCommitteeTotal: 0,
      multipleCommitteesCount: 0,
    };

    // Initialize all official committees with 0
    OFFICIAL_COMMITTEES.forEach((c) => {
      stats.committees[c] = 0;
    });

    members.forEach((m) => {
      // Age Category (Junior: 14 to 24, Senior: 25 and above)
      if (this.isJuniorAge(m)) {
        stats.age.junior++;
      } else {
        stats.age.senior++;
      }

      // Education
      if (m.studentStatus === 'Student') {
        stats.education.totalStudents++;
      }
      if (m.workingStudent) {
        stats.education.workingStudents++;
      }
      if (m.outOfSchoolYouth) {
        stats.education.outOfSchoolYouth++;
      }

      // Employment
      if (m.employmentStatus === 'Employed' || m.employmentStatus === 'Self-Employed' || m.workingStudent) {
        stats.employment.youthWithWork++;
      } else {
        stats.employment.notWorking++;
      }

      // Registered Voters (18 years old & above)
      const isAdult = m.age !== undefined && m.age > 0 ? m.age >= 18 : m.memberCategory === 'Senior';
      if (m.registeredVoter && isAdult) {
        stats.voting.registeredVoters++;
      } else {
        stats.voting.notRegistered++;
      }

      // Parent Baptism Status
      switch (m.parentBaptismStatus) {
        case 'Both Mother & Father':
          stats.parentStatus.bothParents++;
          break;
        case 'Mother Only':
          stats.parentStatus.motherOnly++;
          break;
        case 'Father Only':
          stats.parentStatus.fatherOnly++;
          break;
        default:
          stats.parentStatus.unbaptizedParents++;
          break;
      }

      // Committees breakdown
      const memberCommittees = Array.isArray(m.committees) ? m.committees : [];
      if (memberCommittees.length > 0) {
        stats.withCommitteeTotal++;
        if (memberCommittees.length > 1) {
          stats.multipleCommitteesCount++;
        }
        memberCommittees.forEach((comm) => {
          const canonical = normalizeCommitteeName(comm);
          stats.committees[canonical] = (stats.committees[canonical] || 0) + 1;
        });
      } else {
        stats.withoutCommitteeTotal++;
      }
    });

    return stats;
  },

  /**
   * Calculate Attendance Analytics and Trends
   */
  calculateAttendanceAnalytics(
    records: AttendanceRecord[],
    events: AttendanceEvent[],
    members: Member[],
    dateFilter: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' = 'all'
  ): AttendanceAnalytics {
    const today = new Date();
    const todayStr = this.localDateKey(today);

    const filteredRecords = records.filter((r) => {
      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') return r.eventDate === todayStr;

      const recDate = new Date(`${r.eventDate}T00:00:00`);
      const now = today;

      if (dateFilter === 'week') {
        const diffDays = (now.getTime() - recDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (dateFilter === 'month') {
        return recDate.getMonth() === now.getMonth() && recDate.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'quarter') {
        const currentQ = Math.floor(now.getMonth() / 3);
        const recQ = Math.floor(recDate.getMonth() / 3);
        return currentQ === recQ && recDate.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'year') {
        return recDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let lateCount = 0;
    let presentToday = 0;

    const dateMap: { [dateStr: string]: { present: number; absent: number; excused: number; late: number; label: string } } = {};

    filteredRecords.forEach((rec) => {
      if (rec.attendanceStatus === 'Present') presentCount++;
      else if (rec.attendanceStatus === 'Absent') absentCount++;
      else if (rec.attendanceStatus === 'Excused') excusedCount++;
      else if (rec.attendanceStatus === 'Late') lateCount++;

      if (rec.eventDate === todayStr && (rec.attendanceStatus === 'Present' || rec.attendanceStatus === 'Late')) {
        presentToday++;
      }

      const d = rec.eventDate || 'Unknown';
      if (!dateMap[d]) {
        dateMap[d] = { present: 0, absent: 0, excused: 0, late: 0, label: d };
      }
      if (rec.attendanceStatus === 'Present') dateMap[d].present++;
      else if (rec.attendanceStatus === 'Absent') dateMap[d].absent++;
      else if (rec.attendanceStatus === 'Excused') dateMap[d].excused++;
      else if (rec.attendanceStatus === 'Late') dateMap[d].late++;
    });

    const totalQualifying = presentCount + absentCount + lateCount;
    const overallRate = totalQualifying > 0 ? Math.round(((presentCount + lateCount) / totalQualifying) * 1000) / 10 : 0;

    const trend = Object.keys(dateMap)
      .sort()
      .map((dateStr) => {
        const item = dateMap[dateStr];
        const dayTotal = item.present + item.absent + item.late;
        const pct = dayTotal > 0 ? Math.round(((item.present + item.late) / dayTotal) * 100) : 0;
        return {
          date: dateStr,
          label: dateStr,
          present: item.present,
          absent: item.absent,
          excused: item.excused,
          late: item.late,
          percentage: pct,
        };
      });

    const eventTypeMap: { [type: string]: { count: number; present: number } } = {};
    filteredRecords.forEach((rec) => {
      const ev = events.find((e) => e.eventId === rec.eventId);
      const evType = ev ? ev.eventType : 'Other';
      if (!eventTypeMap[evType]) {
        eventTypeMap[evType] = { count: 0, present: 0 };
      }
      eventTypeMap[evType].count++;
      if (rec.attendanceStatus === 'Present' || rec.attendanceStatus === 'Late') {
        eventTypeMap[evType].present++;
      }
    });

    const byEventType = Object.keys(eventTypeMap).map((type) => {
      const data = eventTypeMap[type];
      return {
        eventType: type,
        count: data.count,
        rate: data.count > 0 ? Math.round((data.present / data.count) * 100) : 0,
      };
    });

    const atRiskCount = members.filter((m) => m.activityStatus === 'At Risk').length;
    const inactiveCount = members.filter((m) => m.activityStatus === 'Inactive' || m.membershipStatus === 'Inactive').length;

    return {
      totalRecords: filteredRecords.length,
      presentCount,
      absentCount,
      excusedCount,
      lateCount,
      overallAttendanceRate: overallRate,
      presentToday,
      atRiskCount,
      inactiveCount,
      trend,
      byEventType,
    };
  },

  /**
   * Baseline sample metrics from the official historical MCGI Youth report
   */
  getOfficialSampleBaseline(): {
    membership: MembershipStatistics;
    demographics: DemographicStatistics;
  } {
    return {
      membership: {
        totalRegisteredMembers: 2649,
        active: { total: 1935, junior: 1286, senior: 649 },
        onAndOff: { total: 230, junior: 140, senior: 90 },
        inactive: { total: 151, junior: 85, senior: 66 },
        suspended: { total: 79, activeSuspended: 42, onAndOffSuspended: 25, inactiveRfa: 12 },
        bilangNgNapatawad: 14,
        missing: 397,
        nbbYouth: {
          overallTotal: 48,
          june: 18,
          july: 15,
          august: 15,
          quarterLabel: '2nd Quarter',
        },
      },
      demographics: {
        age: { junior: 1511, senior: 1138 },
        education: { totalStudents: 1908, workingStudents: 235, outOfSchoolYouth: 152 },
        employment: { youthWithWork: 340, notWorking: 401 },
        voting: { registeredVoters: 46, notRegistered: 2603 },
        parentStatus: { bothParents: 50, motherOnly: 820, fatherOnly: 616, unbaptizedParents: 1163 },
        committees: {
          'Artist Guild': 84,
          'Broadcast': 120,
          'Core Group': 45,
          'MCGI DRRT': 142,
          'Guest Coordinators': 210,
          'LKD': 160,
          'MCGI Bible Readers': 175,
          'Music Ministry': 312,
          'NAR': 115,
          'Officers (Youth, GS, Locale/District)': 68,
          'Photoville': 94,
          'RACS': 88,
          'Servants Ministry': 230,
          'Teatro Kristiano': 195,
          'T.O.C. (Thanksgiving Committee)': 76,
          'Others': 180,
        },
        withCommitteeTotal: 2224,
        withoutCommitteeTotal: 425,
        multipleCommitteesCount: 425,
      },
    };
  },

  /**
   * Generate official 48-column summary array conforming to official MCGI Youth reporting format
   */
  generateOfficialSummaryData(members: Member[]): (string | number)[] {
    const mem = this.calculateMembershipStatistics(members);
    const demo = this.calculateDemographicStatistics(members);

    return [
      mem.totalRegisteredMembers,
      mem.active.total,
      mem.active.junior,
      mem.active.senior,
      mem.onAndOff.total,
      mem.onAndOff.junior,
      mem.onAndOff.senior,
      mem.inactive.total,
      mem.inactive.junior,
      mem.inactive.senior,
      mem.suspended.total,
      mem.suspended.activeSuspended,
      mem.suspended.onAndOffSuspended,
      mem.suspended.inactiveRfa,
      mem.bilangNgNapatawad,
      mem.missing,
      mem.nbbYouth.overallTotal,
      mem.nbbYouth.june,
      mem.nbbYouth.july,
      mem.nbbYouth.august,
      demo.withCommitteeTotal,
      demo.multipleCommitteesCount,
      demo.committees['Artist Guild'] || 0,
      demo.committees['Broadcast'] || 0,
      demo.committees['Core Group'] || 0,
      demo.committees['MCGI DRRT'] || 0,
      demo.committees['Guest Coordinators'] || 0,
      demo.committees['LKD'] || 0,
      demo.committees['MCGI Bible Readers'] || 0,
      demo.committees['Music Ministry'] || 0,
      demo.committees['NAR'] || 0,
      demo.committees['Officers (Youth, GS, Locale/District)'] || 0,
      demo.committees['Photoville'] || 0,
      demo.committees['RACS'] || 0,
      demo.committees['Servants Ministry'] || 0,
      demo.committees['Teatro Kristiano'] || 0,
      demo.committees['T.O.C. (Thanksgiving Committee)'] || 0,
      demo.committees['Others'] || 0,
      demo.withoutCommitteeTotal,
      demo.education.totalStudents,
      demo.employment.youthWithWork,
      demo.voting.registeredVoters,
      demo.education.workingStudents,
      demo.education.outOfSchoolYouth,
      demo.parentStatus.motherOnly,
      demo.parentStatus.fatherOnly,
      demo.parentStatus.bothParents,
      demo.parentStatus.unbaptizedParents,
    ];
  },
};

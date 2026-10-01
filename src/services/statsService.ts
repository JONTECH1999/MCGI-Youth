import { Member } from '../types/member';
import { AttendanceRecord } from '../types/attendance';
import { AttendanceEvent } from '../types/event';
import { DemographicStatistics, MembershipStatistics, AttendanceAnalytics } from '../types/statistics';
import { OFFICIAL_COMMITTEES } from '../data/sampleCommittees';

export const StatsService = {
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
      missing: 0,
    };

    members.forEach((m) => {
      const isJunior = m.memberCategory === 'Junior' || (m.age > 0 && m.age < 18);

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
          // Categorize suspended types
          if (m.activityStatus === 'Active' || m.activityStatus === 'Regular') {
            stats.suspended.activeSuspended++;
          } else if (m.activityStatus === 'At Risk') {
            stats.suspended.onAndOffSuspended++;
          } else {
            stats.suspended.inactiveRfa++;
          }
          break;

        case 'Missing':
          stats.missing++;
          break;
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
      multipleCommitteesCount: 0,
    };

    // Initialize committee counts
    OFFICIAL_COMMITTEES.forEach((c) => {
      stats.committees[c] = 0;
    });

    members.forEach((m) => {
      // Age Category
      if (m.memberCategory === 'Junior' || (m.age > 0 && m.age < 18)) {
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

      // Voting
      if (m.registeredVoter) {
        stats.voting.registeredVoters++;
      } else {
        stats.voting.notRegistered++;
      }

      // Parent Status
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

      // Committees (Member can have multiple committees, do not double count member)
      if (Array.isArray(m.committees)) {
        if (m.committees.length > 1) {
          stats.multipleCommitteesCount++;
        }
        m.committees.forEach((comm) => {
          if (stats.committees[comm] !== undefined) {
            stats.committees[comm]++;
          } else {
            stats.committees[comm] = (stats.committees[comm] || 0) + 1;
          }
        });
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
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter by date range if specified
    const filteredRecords = records.filter((r) => {
      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') return r.eventDate === todayStr;

      const recDate = new Date(r.eventDate);
      const now = new Date();

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

    // Trend chronologically
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

    // By Event Type
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

    // Count At Risk and Inactive members
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
   * (for comparative view and demonstration prior to full data sync)
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
        missing: 397,
      },
      demographics: {
        age: { junior: 1511, senior: 1138 },
        education: { totalStudents: 1908, workingStudents: 235, outOfSchoolYouth: 152 },
        employment: { youthWithWork: 340, notWorking: 401 },
        voting: { registeredVoters: 46, notRegistered: 2603 },
        parentStatus: { bothParents: 50, motherOnly: 820, fatherOnly: 616, unbaptizedParents: 1163 },
        committees: {
          'Music Ministry': 312,
          'Teatro Kristiano': 195,
          'Artist Guild': 84,
          'Broadcast': 120,
          'Core Group': 45,
          'MCGI DRRT': 142,
          'Guest Coordinators': 210,
          'LKD': 160,
          'MCGI Bible Readers': 175,
          'Officers': 68,
          'Photoville': 94,
          'RACS': 88,
          'Servants Ministry': 230,
          'T.O.C.': 76,
          'NAR': 115,
          'Others': 180,
        },
        multipleCommitteesCount: 425,
      },
    };
  },
};

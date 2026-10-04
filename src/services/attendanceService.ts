import { AttendanceRecord, AttendanceStatus } from '../types/attendance';
import { Member, ActivityStatus } from '../types/member';
import { AttendanceRules } from '../types/settings';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { StorageService } from './storageService';

export const AttendanceService = {
  /**
   * Save a batch of attendance records with duplicate protection and member recalculation
   */
  async saveBatch(
    records: AttendanceRecord[],
    currentMembers: Member[],
    rules: AttendanceRules,
    userName: string
  ): Promise<{ success: boolean; message: string; updatedMembers: Member[]; allAttendance: AttendanceRecord[] }> {
    if (records.length === 0) {
      return {
        success: false,
        message: 'No attendance records to save.',
        updatedMembers: currentMembers,
        allAttendance: StorageService.getAttendance(),
      };
    }

    const existingAttendance = StorageService.getAttendance();
    const attendanceMap = new Map<string, AttendanceRecord>();

    // Map existing attendance by memberId_scheduleId to prevent duplicates
    existingAttendance.forEach((rec) => {
      attendanceMap.set(`${rec.memberId}_${rec.scheduleId}`, rec);
    });

    // Merge new records
    records.forEach((rec) => {
      const key = `${rec.memberId}_${rec.scheduleId}`;
      attendanceMap.set(key, {
        ...rec,
        recordedBy: userName || rec.recordedBy || 'Officer',
        updatedAt: new Date().toISOString(),
      });
    });

    const mergedAttendance = Array.from(attendanceMap.values());
    StorageService.saveAttendance(mergedAttendance);

    // Recalculate each member's attendance statistics and activity status
    const updatedMembers = currentMembers.map((member) => {
      return this.recalculateMemberAttendance(member, mergedAttendance, rules);
    });
    StorageService.saveMembers(updatedMembers);

    // Audit log
    StorageService.addLog(
      userName || 'Officer',
      'RECORD_ATTENDANCE',
      'ATTENDANCE',
      `Recorded/updated attendance for ${records.length} member(s) for ${records[0].eventName} (${records[0].schedule})`,
      records[0].scheduleId
    );

    return {
      success: true,
      message: `Successfully saved ${records.length} attendance record(s).`,
      updatedMembers,
      allAttendance: mergedAttendance,
    };
  },

  /**
   * Recalculate individual member attendance percentage, streak, and activity status
   */
  recalculateMemberAttendance(
    member: Member,
    allAttendance: AttendanceRecord[],
    rules: AttendanceRules
  ): Member {
    const memberRecords = allAttendance
      .filter((r) => r.memberId === member.memberId)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    if (memberRecords.length === 0) {
      return member;
    }

    // Latest attendance date where present or late
    const attendedRecords = memberRecords.filter((r) => r.attendanceStatus === 'Present' || r.attendanceStatus === 'Late');
    const lastAttendanceDate = attendedRecords.length > 0 ? attendedRecords[0].eventDate : member.lastAttendanceDate;

    // Filter qualifying events based on rules
    let qualifying = memberRecords;
    if (!rules.excusedCountsAsMissed) {
      qualifying = qualifying.filter((r) => r.attendanceStatus !== 'Excused');
    }

    const totalQualifying = qualifying.length;
    const attendedCount = attendedRecords.length;
    const percentage = totalQualifying > 0 ? Math.round((attendedCount / totalQualifying) * 1000) / 10 : 0;

    // Compute Activity Status based on configurable rules
    const { activityStatus, reason } = this.calculateActivityStatus(
      member,
      memberRecords,
      rules,
      lastAttendanceDate,
      percentage
    );

    return {
      ...member,
      lastAttendanceDate,
      attendanceCount: attendedCount,
      attendancePercentage: percentage,
      activityStatus,
      activityReason: reason,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Calculate Activity Status & generate human-readable explanation
   */
  calculateActivityStatus(
    member: Member,
    sortedRecords: AttendanceRecord[],
    rules: AttendanceRules,
    lastAttendanceDate?: string,
    percentage: number = 0
  ): { activityStatus: ActivityStatus; reason?: string } {
    // Check days since last attendance
    if (lastAttendanceDate) {
      const daysSince = Math.floor((new Date().getTime() - new Date(lastAttendanceDate).getTime()) / (1000 * 3600 * 24));
      if (daysSince >= rules.daysWithoutAttendanceBeforeInactive) {
        return {
          activityStatus: 'Inactive',
          reason: `No attendance for ${daysSince} days (threshold is ${rules.daysWithoutAttendanceBeforeInactive} days).`,
        };
      }
    }

    // Check recent consecutive missed events
    const recentRecords = sortedRecords.slice(0, Math.max(rules.missedEventsBeforeInactive, 5));
    const recentMissed = recentRecords.filter((r) => r.attendanceStatus === 'Absent').length;

    if (recentMissed >= rules.missedEventsBeforeInactive) {
      return {
        activityStatus: 'Inactive',
        reason: `Missed ${recentMissed} consecutive qualifying events (threshold is ${rules.missedEventsBeforeInactive}).`,
      };
    }

    if (recentMissed >= rules.missedEventsBeforeAtRisk || percentage < rules.activeThresholdPercent) {
      return {
        activityStatus: 'At Risk',
        reason: recentMissed >= rules.missedEventsBeforeAtRisk
          ? `Missed ${recentMissed} of the last ${recentRecords.length} qualifying events.`
          : `Attendance rate (${percentage}%) is below the active threshold (${rules.activeThresholdPercent}%).`,
      };
    }

    if (percentage >= rules.regularThresholdPercent) {
      return {
        activityStatus: 'Regular',
        reason: `Attendance rate is ${percentage}% (>= ${rules.regularThresholdPercent}% threshold).`,
      };
    }

    return {
      activityStatus: 'Active',
      reason: `Attendance rate is ${percentage}%.`,
    };
  },

  /**
   * Calculate streaks (current streak and longest streak of consecutive attended events)
   */
  calculateStreaks(memberId: string, allAttendance: AttendanceRecord[]): { currentStreak: number; longestStreak: number } {
    const records = allAttendance
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < records.length; i++) {
      const status = records[i].attendanceStatus;
      if (status === 'Present' || status === 'Late') {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else if (status === 'Absent') {
        tempStreak = 0;
      }
      // Excused does not break streak
    }

    // Current streak from the end backwards
    for (let i = records.length - 1; i >= 0; i--) {
      const status = records[i].attendanceStatus;
      if (status === 'Present' || status === 'Late') {
        currentStreak++;
      } else if (status === 'Absent') {
        break;
      }
    }

    return { currentStreak, longestStreak };
  }
};

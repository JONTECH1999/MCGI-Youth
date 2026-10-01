export interface MembershipStatistics {
  totalRegisteredMembers: number;
  active: {
    total: number;
    junior: number;
    senior: number;
  };
  onAndOff: {
    total: number;
    junior: number;
    senior: number;
  };
  inactive: {
    total: number;
    junior: number;
    senior: number;
  };
  suspended: {
    total: number;
    activeSuspended: number;
    onAndOffSuspended: number;
    inactiveRfa: number;
  };
  missing: number;
}

export interface DemographicStatistics {
  age: {
    junior: number;
    senior: number;
  };
  education: {
    totalStudents: number;
    workingStudents: number;
    outOfSchoolYouth: number;
  };
  employment: {
    youthWithWork: number;
    notWorking: number;
  };
  voting: {
    registeredVoters: number;
    notRegistered: number;
  };
  parentStatus: {
    bothParents: number;
    motherOnly: number;
    fatherOnly: number;
    unbaptizedParents: number;
  };
  committees: { [committeeName: string]: number };
  multipleCommitteesCount: number;
}

export interface AttendanceAnalytics {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  overallAttendanceRate: number;
  presentToday: number;
  atRiskCount: number;
  inactiveCount: number;
  trend: {
    date: string;
    label: string;
    present: number;
    absent: number;
    excused: number;
    late: number;
    percentage: number;
  }[];
  byEventType: {
    eventType: string;
    count: number;
    rate: number;
  }[];
}

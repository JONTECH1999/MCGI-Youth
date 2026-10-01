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
  bilangNgNapatawad: number;
  missing: number;
  nbbYouth: {
    overallTotal: number;
    june: number;
    july: number;
    august: number;
    quarterLabel: string;
  };
}

export interface DemographicStatistics {
  age: {
    junior: number; // 14 to 24 years old
    senior: number; // 25 years old & above
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
    registeredVoters: number; // 18 years and above
    notRegistered: number;
  };
  parentStatus: {
    bothParents: number;
    motherOnly: number;
    fatherOnly: number;
    unbaptizedParents: number;
  };
  committees: { [committeeName: string]: number };
  withCommitteeTotal: number;
  withoutCommitteeTotal: number;
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

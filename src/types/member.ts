// MCGI Youth Membership, Attendance & Reporting System Types

export type MembershipStatus = 'Active' | 'On & Off' | 'Inactive' | 'Suspended' | 'Missing';

export type MemberCategory = 'Junior' | 'Senior';

export type ActivityStatus = 'Active' | 'Regular' | 'At Risk' | 'Inactive';

export type StudentStatus = 'Student' | 'Non-Student';
export type EmploymentStatus = 'Employed' | 'Unemployed' | 'Self-Employed';
export type ParentBaptismStatus = 'Both Mother & Father' | 'Mother Only' | 'Father Only' | 'Unbaptized Parent/s';

export interface Member {
  memberId: string; // Unique Member ID (e.g., M0001)
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  birthday: string; // YYYY-MM-DD
  age: number;
  gender: 'Male' | 'Female';
  contactNumber: string;
  email?: string;
  address?: string;
  membershipStatus: MembershipStatus;
  memberCategory: MemberCategory; // Junior (typically <18) or Senior (>=18)
  studentStatus: StudentStatus;
  employmentStatus: EmploymentStatus;
  registeredVoter: boolean;
  workingStudent: boolean;
  outOfSchoolYouth: boolean;
  parentBaptismStatus: ParentBaptismStatus;
  committees: string[]; // A member can belong to multiple committees
  dateRegistered: string; // YYYY-MM-DD
  lastAttendanceDate?: string; // YYYY-MM-DD
  attendanceCount: number;
  attendancePercentage: number;
  activityStatus: ActivityStatus;
  activityReason?: string; // e.g., "Missed 4 of the last 5 qualifying events."
  notes?: string;
  suspensionCategory?: 'Active Suspended' | 'On & Off Suspended' | 'Inactive / RFA';
  isForgiven?: boolean; // Bilang ng Napatawad
  isNBB?: boolean; // Newly Baptized Brethren (NBB Youth)
  nbbMonth?: 'June' | 'July' | 'August' | string;
  nbbQuarter?: string;
  baptismDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeletedMember extends Member {
  deletedAt: string;
  deletedBy: string;
}

export interface MemberStatusHistory {
  historyId: string;
  memberId: string;
  previousStatus: MembershipStatus;
  newStatus: MembershipStatus;
  reason: string;
  changedBy: string;
  changedAt: string;
}

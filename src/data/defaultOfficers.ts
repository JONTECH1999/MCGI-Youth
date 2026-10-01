export type UserRole = 'ADMIN' | 'OFFICER';

export interface OfficerAccount {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  title: string;
  passkey: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export const INITIAL_OFFICERS: OfficerAccount[] = [
  {
    id: 'OFF-001',
    username: 'aljon.admin',
    fullName: 'Officer Aljon Navarro',
    role: 'ADMIN',
    email: 'aljon.navarro@ascoville.org',
    title: 'District Youth Executive / Head Admin',
    passkey: '1234',
    status: 'Active',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'OFF-002',
    username: 'officer.attendance',
    fullName: 'Youth Attendance Officer',
    role: 'OFFICER',
    email: 'attendance.officer@ascoville.org',
    title: 'Committee Attendance Secretary',
    passkey: '1234',
    status: 'Active',
    createdAt: '2026-02-15T08:00:00Z',
  },
  {
    id: 'OFF-003',
    username: 'maria.officer',
    fullName: 'Sister Maria Santos',
    role: 'OFFICER',
    email: 'maria.santos@ascoville.org',
    title: 'TK & Junior Youth Coordinator',
    passkey: '1234',
    status: 'Active',
    createdAt: '2026-03-10T08:00:00Z',
  }
];

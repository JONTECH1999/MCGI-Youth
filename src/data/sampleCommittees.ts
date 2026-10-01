export const OFFICIAL_COMMITTEES = [
  'Artist Guild',
  'Broadcast',
  'Core Group',
  'MCGI DRRT',
  'Guest Coordinators',
  'LKD',
  'MCGI Bible Readers',
  'Music Ministry',
  'NAR',
  'Officers',
  'Photoville',
  'RACS',
  'Servants Ministry',
  'Teatro Kristiano',
  'T.O.C.',
  'Others',
] as const;

export type CommitteeName = typeof OFFICIAL_COMMITTEES[number];

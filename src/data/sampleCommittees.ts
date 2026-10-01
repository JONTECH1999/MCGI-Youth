import { CommitteeSettingItem } from '../types/settings';

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
  'Officers (Youth, GS, Locale/District)',
  'Photoville',
  'RACS',
  'Servants Ministry',
  'Teatro Kristiano',
  'T.O.C. (Thanksgiving Committee)',
  'Others',
] as const;

export type CommitteeName = typeof OFFICIAL_COMMITTEES[number];

export interface CommitteeMetadata {
  canonicalName: CommitteeName;
  alias: string;
  displayLabel: string;
  description: string;
  aliases: string[];
}

export const COMMITTEE_METADATA: Record<string, CommitteeMetadata> = {
  'Artist Guild': {
    canonicalName: 'Artist Guild',
    alias: 'AG',
    displayLabel: 'Artist Guild (AG)',
    description: 'Visual arts, graphic design, staging decor, and backdrop design',
    aliases: ['artist guild', 'ag', 'arts'],
  },
  'Broadcast': {
    canonicalName: 'Broadcast',
    alias: 'BC',
    displayLabel: 'Broadcast (Audio / Video)',
    description: 'Live streaming, camera operations, sound engineering, and video recording',
    aliases: ['broadcast', 'bc', 'audio/video', 'av'],
  },
  'Core Group': {
    canonicalName: 'Core Group',
    alias: 'CG',
    displayLabel: 'Core Group (Youth Leadership)',
    description: 'Locale youth core group and auxiliary pastoral ministry coordination',
    aliases: ['core group', 'cg', 'youth core'],
  },
  'MCGI DRRT': {
    canonicalName: 'MCGI DRRT',
    alias: 'DRRT',
    displayLabel: 'MCGI DRRT (Emergency & First Aid)',
    description: 'Disaster risk reduction, first aid medical responders, rescue & emergency assistance',
    aliases: ['mcgi drrt', 'drrt', 'first aid', 'rescue'],
  },
  'Guest Coordinators': {
    canonicalName: 'Guest Coordinators',
    alias: 'GCOS',
    displayLabel: 'Guest Coordinators (GCOS)',
    description: 'Guest Coordination and Oversight Services, visitor registration, welcoming & ushering',
    aliases: ['guest coordinators', 'gcos', 'guest coordinator', 'ushers', 'ushering'],
  },
  'LKD': {
    canonicalName: 'LKD',
    alias: 'LKD',
    displayLabel: 'LKD (Kabataan Directory & Care)',
    description: 'Lokal Kabataan Directory, member follow-up, attendance verification, and brethren care',
    aliases: ['lkd', 'directory'],
  },
  'MCGI Bible Readers': {
    canonicalName: 'MCGI Bible Readers',
    alias: 'BR',
    displayLabel: 'MCGI Bible Readers',
    description: 'Holy Scripture readers, verse citation, Bible study support, and topical reading',
    aliases: ['mcgi bible readers', 'bible readers', 'br'],
  },
  'Music Ministry': {
    canonicalName: 'Music Ministry',
    alias: 'Choir',
    displayLabel: 'Music Ministry (Youth Choir & Music)',
    description: 'Youth Choir singers, accompanists, instrumentalists, and special songs of praises',
    aliases: ['music ministry', 'choir', 'youth choir', 'music', 'instrumentalist'],
  },
  'NAR': {
    canonicalName: 'NAR',
    alias: 'NAR',
    displayLabel: 'NAR (Newly Baptized Brethren Care)',
    description: 'Newly Added Brethren Reception, follow-up, integration & spiritual accompaniment',
    aliases: ['nar', 'newly added', 'nbb reception'],
  },
  'Officers (Youth, GS, Locale/District)': {
    canonicalName: 'Officers (Youth, GS, Locale/District)',
    alias: 'Officers',
    displayLabel: 'Officers (Youth, GS, Locale / District)',
    description: 'Designated youth executives, Group Servants (GS), locale youth officers',
    aliases: ['officers (youth, gs, locale/district)', 'officers', 'youth officers', 'gs', 'group servant'],
  },
  'Photoville': {
    canonicalName: 'Photoville',
    alias: 'PV',
    displayLabel: 'Photoville (Official Photography)',
    description: 'Official event photography, documentation, photojournalism, and historical photo archive',
    aliases: ['photoville', 'pv', 'photography'],
  },
  'RACS': {
    canonicalName: 'RACS',
    alias: 'RACS',
    displayLabel: 'RACS (Radio Communications)',
    description: 'Radio and Communications Society, logistics coordination radio network',
    aliases: ['racs', 'radio'],
  },
  'Servants Ministry': {
    canonicalName: 'Servants Ministry',
    alias: 'SM',
    displayLabel: 'Servants Ministry (Sanctuary Logistics)',
    description: 'Sanctuary preparation, hall maintenance, chairs & sound physical setup, cleaning',
    aliases: ['servants ministry', 'sm', 'servants', 'logistics'],
  },
  'Teatro Kristiano': {
    canonicalName: 'Teatro Kristiano',
    alias: 'TK',
    displayLabel: 'Teatro Kristiano (TK)',
    description: 'Interpretative praise, sign language praise songs, and spiritual stage drama presentations',
    aliases: ['teatro kristiano', 'tk', 'teatro', 'sign language'],
  },
  'T.O.C. (Thanksgiving Committee)': {
    canonicalName: 'T.O.C. (Thanksgiving Committee)',
    alias: 'TOC',
    displayLabel: 'T.O.C. (Thanksgiving Committee)',
    description: 'Thanksgiving operations committee, stage flow, offering collection & technical oversight',
    aliases: ['t.o.c. (thanksgiving committee)', 't.o.c.', 'toc', 'thanksgiving committee'],
  },
  'Others': {
    canonicalName: 'Others',
    alias: 'Other',
    displayLabel: 'Others (Auxiliary / Special Committees)',
    description: 'Other auxiliary committees, special community outreach, and ad-hoc youth committees',
    aliases: ['others', 'other'],
  },
};

/**
 * Standard default committee settings list for settings configuration
 */
export const DEFAULT_COMMITTEE_SETTINGS: CommitteeSettingItem[] = OFFICIAL_COMMITTEES.map((name, index) => {
  const meta = COMMITTEE_METADATA[name];
  return {
    id: `COMM-${String(index + 1).padStart(2, '0')}`,
    name,
    alias: meta?.alias || '',
    description: meta?.description || '',
    isActive: true,
  };
});

/**
 * Helper to match any arbitrary committee string (e.g. 'GCOS', 'Choir', 'TK', 'T.O.C.')
 * to its canonical name in OFFICIAL_COMMITTEES
 */
export function normalizeCommitteeName(input: string): CommitteeName {
  const clean = input.trim().toLowerCase();
  for (const [canonical, meta] of Object.entries(COMMITTEE_METADATA)) {
    if (canonical.toLowerCase() === clean) return meta.canonicalName;
    if (meta.alias.toLowerCase() === clean) return meta.canonicalName;
    if (meta.aliases.some((a) => a === clean || clean.includes(a))) return meta.canonicalName;
  }
  return 'Others';
}

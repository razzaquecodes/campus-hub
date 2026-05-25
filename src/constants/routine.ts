// constants/routine.ts
// BBIT — B.Tech CSE, 2nd Year, 4th Semester, Section C
// Room: AC-421 (theory) | AC-403, AC-405 (labs)
// Parsed from official class routine

export interface RoutineSlot {
  subject: string;
  code: string;
  time: string;
  startTime: number; // minutes from midnight
  endTime: number;
  room: string;
  instructor: string;
  type: 'theory' | 'lab' | 'tutorial' | 'other';
  color: string;
}

export interface SubjectInfo {
  code: string;
  name: string;
  credits: number;
  type: 'Theory' | 'Practical';
  faculty: string;
  shortName: string;
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
export const SEMESTER_SUBJECTS: SubjectInfo[] = [
  { code: 'PCC-CS 401', name: 'Discrete Mathematics',                  credits: 4, type: 'Theory',    faculty: 'Mr. Debraj Roy',           shortName: 'DM' },
  { code: 'PCC-CS 402', name: 'Computer Architecture',                 credits: 4, type: 'Theory',    faculty: 'Mr. Rajat Subhra Nandi',   shortName: 'CA' },
  { code: 'PCC-CS 403', name: 'Formal Language & Automata Theory',     credits: 3, type: 'Theory',    faculty: 'Mr. Rishov Saha',          shortName: 'FLAT' },
  { code: 'PCC-CS 404', name: 'Design & Analysis of Algorithms',       credits: 4, type: 'Theory',    faculty: 'Mr. Arjun Chatterjee',     shortName: 'DAA' },
  { code: 'BSC 401',    name: 'Biology',                               credits: 3, type: 'Theory',    faculty: 'Mr. Fahad Zafar',          shortName: 'BIO' },
  { code: 'MC 401',     name: 'Environmental Sciences',                credits: 2, type: 'Theory',    faculty: 'Dr. Jyoti Kusum Acharya',  shortName: 'EVS' },
  { code: 'PCC-CS 492', name: 'Computer Architecture Lab',             credits: 2, type: 'Practical', faculty: 'Mr. Rupam Sardar',         shortName: 'CA Lab' },
  { code: 'PCC-CS 494', name: 'Design & Analysis of Algorithms Lab',   credits: 2, type: 'Practical', faculty: 'Mr. Arjun Chatterjee',     shortName: 'DAA Lab' },
];

// ─── Faculty ──────────────────────────────────────────────────────────────────
export const FACULTY = [
  { abbr: 'DR',  name: 'Mr. Debraj Roy',           subject: 'Discrete Mathematics',    color: '#8B5CF6' },
  { abbr: 'RSN', name: 'Mr. Rajat Subhra Nandi',   subject: 'Computer Architecture',   color: '#6366F1' },
  { abbr: 'RS1', name: 'Mr. Rishov Saha',          subject: 'FLAT',                    color: '#F59E0B' },
  { abbr: 'ARC', name: 'Mr. Arjun Chatterjee',     subject: 'DAA / DAA Lab',           color: '#EC4899' },
  { abbr: 'FZ',  name: 'Mr. Fahad Zafar',          subject: 'Biology',                 color: '#14B8A6' },
  { abbr: 'JKA', name: 'Dr. Jyoti Kusum Acharya',  subject: 'Environmental Sciences',  color: '#10B981' },
  { abbr: 'RS',  name: 'Mr. Rupam Sardar',         subject: 'CA Lab',                  color: '#3B82F6' },
  { abbr: 'ATC', name: 'Dr. Atal Chaudhury',       subject: 'Computer Architecture',   color: '#7C3AED' },
];

// ─── Color map ────────────────────────────────────────────────────────────────
const C = {
  dm:    '#8B5CF6', // Discrete Math — violet
  ca:    '#6366F1', // Computer Architecture — indigo
  flat:  '#F59E0B', // FLAT — amber
  daa:   '#EC4899', // DAA — pink
  bio:   '#14B8A6', // Biology — teal
  evs:   '#10B981', // Environmental Sciences — emerald
  caLab: '#3B82F6', // CA Lab — blue
  daaLab:'#EF4444', // DAA Lab — red
  mentor:'#A78BFA', // Mentoring — light purple
  tpo:   '#F97316', // TPO — orange
  rbl:   '#06B6D4', // Research Based Learning — cyan
  pbl:   '#84CC16', // Problem/Project Based Learning — lime
  tut:   '#D946EF', // Tutorial — fuchsia
};

// ─── Weekly Routine ───────────────────────────────────────────────────────────
// Key = JS day of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export const BBIT_CSEC_SEM4_ROUTINE: Record<number, RoutineSlot[]> = {

  // ── Monday ──────────────────────────────────────────────────────────────
  1: [
    { subject: 'Computer Architecture',                code: 'PCC-CS 402', time: '9:50 - 10:40',  startTime: 590,  endTime: 640,  room: 'AC-421', instructor: 'Mr. Rajat Subhra Nandi',   type: 'theory',   color: C.ca },
    { subject: 'Formal Language & Automata Theory',     code: 'PCC-CS 403', time: '10:40 - 11:30', startTime: 640,  endTime: 690,  room: 'AC-421', instructor: 'Mr. Rishov Saha',          type: 'theory',   color: C.flat },
    { subject: 'Mentoring',                             code: '',           time: '11:30 - 12:20', startTime: 690,  endTime: 740,  room: 'AC-421', instructor: 'Class Mentor',              type: 'other',    color: C.mentor },
    { subject: 'Design & Analysis of Algorithms',       code: 'PCC-CS 404', time: '1:00 - 1:50',   startTime: 780,  endTime: 830,  room: 'AC-421', instructor: 'Mr. Arjun Chatterjee',     type: 'theory',   color: C.daa },
    { subject: 'Discrete Mathematics',                  code: 'PCC-CS 401', time: '2:40 - 3:30',   startTime: 880,  endTime: 930,  room: 'AC-421', instructor: 'Mr. Debraj Roy',           type: 'theory',   color: C.dm },
    { subject: 'Tutorial',                              code: '',           time: '3:30 - 4:20',   startTime: 930,  endTime: 980,  room: 'AC-421', instructor: 'Faculty',                   type: 'tutorial', color: C.tut },
  ],

  // ── Tuesday ─────────────────────────────────────────────────────────────
  2: [
    { subject: 'DAA Lab (GR-1)',                        code: 'PCC-CS 494', time: '9:00 - 11:30',  startTime: 540,  endTime: 690,  room: 'AC-403', instructor: 'Mr. Arjun Chatterjee',     type: 'lab',      color: C.daaLab },
    { subject: 'Biology',                               code: 'BSC 401',    time: '11:30 - 12:20', startTime: 690,  endTime: 740,  room: 'AC-421', instructor: 'Mr. Fahad Zafar',           type: 'theory',   color: C.bio },
    { subject: 'TPO Class',                             code: '',           time: '1:00 - 2:40',   startTime: 780,  endTime: 880,  room: 'AC-421', instructor: 'Training & Placement',      type: 'other',    color: C.tpo },
    { subject: 'Research Based Learning',               code: '',           time: '2:40 - 3:30',   startTime: 880,  endTime: 930,  room: 'AC-421', instructor: 'Faculty',                   type: 'other',    color: C.rbl },
    { subject: 'Design & Analysis of Algorithms',       code: 'PCC-CS 404', time: '3:30 - 4:20',   startTime: 930,  endTime: 980,  room: 'AC-421', instructor: 'Mr. Arjun Chatterjee',     type: 'theory',   color: C.daa },
  ],

  // ── Wednesday ───────────────────────────────────────────────────────────
  3: [
    { subject: 'Computer Architecture',                code: 'PCC-CS 402', time: '9:50 - 10:40',  startTime: 590,  endTime: 640,  room: 'AC-421', instructor: 'Mr. Rajat Subhra Nandi',   type: 'theory',   color: C.ca },
    { subject: 'Discrete Mathematics',                  code: 'PCC-CS 401', time: '10:40 - 11:30', startTime: 640,  endTime: 690,  room: 'AC-421', instructor: 'Mr. Debraj Roy',           type: 'theory',   color: C.dm },
    { subject: 'Biology',                               code: 'BSC 401',    time: '11:30 - 12:20', startTime: 690,  endTime: 740,  room: 'AC-421', instructor: 'Mr. Fahad Zafar',           type: 'theory',   color: C.bio },
    { subject: 'Formal Language & Automata Theory',     code: 'PCC-CS 403', time: '1:00 - 1:50',   startTime: 780,  endTime: 830,  room: 'AC-421', instructor: 'Mr. Rishov Saha',          type: 'theory',   color: C.flat },
    { subject: 'Computer Architecture',                code: 'PCC-CS 402', time: '1:50 - 2:40',   startTime: 830,  endTime: 880,  room: 'AC-421', instructor: 'Mr. Rajat Subhra Nandi',   type: 'theory',   color: C.ca },
    { subject: 'Research Based Learning',               code: '',           time: '2:40 - 4:20',   startTime: 880,  endTime: 980,  room: 'AC-421', instructor: 'Faculty',                   type: 'other',    color: C.rbl },
  ],

  // ── Thursday ────────────────────────────────────────────────────────────
  4: [
    { subject: 'Design & Analysis of Algorithms',       code: 'PCC-CS 404', time: '9:50 - 10:40',  startTime: 590,  endTime: 640,  room: 'AC-421', instructor: 'Mr. Arjun Chatterjee',     type: 'theory',   color: C.daa },
    { subject: 'Formal Language & Automata Theory',     code: 'PCC-CS 403', time: '10:40 - 11:30', startTime: 640,  endTime: 690,  room: 'AC-421', instructor: 'Mr. Rishov Saha',          type: 'theory',   color: C.flat },
    { subject: 'Computer Architecture',                code: 'PCC-CS 402', time: '11:30 - 12:20', startTime: 690,  endTime: 740,  room: 'AC-421', instructor: 'Dr. Atal Chaudhury',       type: 'theory',   color: C.ca },
    { subject: 'Environmental Sciences',                code: 'MC 401',     time: '1:00 - 1:50',   startTime: 780,  endTime: 830,  room: 'AC-421', instructor: 'Dr. Jyoti Kusum Acharya',  type: 'theory',   color: C.evs },
    { subject: 'Formal Language & Automata Theory',     code: 'PCC-CS 403', time: '1:50 - 2:40',   startTime: 830,  endTime: 880,  room: 'AC-421', instructor: 'Mr. Rishov Saha',          type: 'theory',   color: C.flat },
    { subject: 'Computer Architecture',                code: 'PCC-CS 402', time: '2:40 - 3:30',   startTime: 880,  endTime: 930,  room: 'AC-421', instructor: 'Mr. Rajat Subhra Nandi',   type: 'theory',   color: C.ca },
    { subject: 'Problem Based Learning',                code: '',           time: '3:30 - 4:20',   startTime: 930,  endTime: 980,  room: 'AC-421', instructor: 'Faculty',                   type: 'other',    color: C.pbl },
  ],

  // ── Friday ──────────────────────────────────────────────────────────────
  5: [
    { subject: 'Computer Architecture Lab (GR-1)',      code: 'PCC-CS 492', time: '9:00 - 11:30',  startTime: 540,  endTime: 690,  room: 'AC-405', instructor: 'Mr. Rupam Sardar',         type: 'lab',      color: C.caLab },
    { subject: 'Design & Analysis of Algorithms',       code: 'PCC-CS 404', time: '11:30 - 12:20', startTime: 690,  endTime: 740,  room: 'AC-421', instructor: 'Mr. Arjun Chatterjee',     type: 'theory',   color: C.daa },
    { subject: 'Design & Analysis of Algorithms',       code: 'PCC-CS 404', time: '1:00 - 1:50',   startTime: 780,  endTime: 830,  room: 'AC-421', instructor: 'Mr. Arjun Chatterjee',     type: 'theory',   color: C.daa },
    { subject: 'Problem Based Learning',                code: '',           time: '1:50 - 2:40',   startTime: 830,  endTime: 880,  room: 'AC-421', instructor: 'Faculty',                   type: 'other',    color: C.pbl },
    { subject: 'Project Based Learning',                code: '',           time: '2:40 - 4:20',   startTime: 880,  endTime: 980,  room: 'AC-421', instructor: 'Faculty',                   type: 'other',    color: C.pbl },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTodayClasses(): RoutineSlot[] {
  const day = new Date().getDay();
  return BBIT_CSEC_SEM4_ROUTINE[day] || [];
}

export function getClassesForDay(day: number): RoutineSlot[] {
  return BBIT_CSEC_SEM4_ROUTINE[day] || [];
}

export function getCurrentAndNextClass(): {
  current: RoutineSlot | null;
  next: RoutineSlot | null;
  remaining: number;
} {
  const todayClasses = getTodayClasses();
  if (!todayClasses.length) return { current: null, next: null, remaining: 0 };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let current: RoutineSlot | null = null;
  let next: RoutineSlot | null = null;
  let remaining = 0;

  for (let i = 0; i < todayClasses.length; i++) {
    const cls = todayClasses[i];
    if (currentMinutes >= cls.startTime && currentMinutes < cls.endTime) {
      current = cls;
      if (i + 1 < todayClasses.length) next = todayClasses[i + 1];
      remaining = todayClasses.length - (i + 1);
      break;
    } else if (currentMinutes < cls.startTime) {
      if (!next) next = cls;
      remaining = todayClasses.length - i;
      break;
    }
  }

  return { current, next, remaining };
}

/** Day names for UI */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

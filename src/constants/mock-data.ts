import type {
  Announcement,
  Assignment,
  CalendarEvent,
  FacultyMember,
  ScheduleSlot,
  Subject,
  UserProfile,
} from '@/types/database';

export const MOCK_PROFILE: UserProfile = {
  id: 'demo-user-1',
  roll_number: '20300120001',
  email: 'student@makaut.edu',
  full_name: 'Arjun Mehta',
  role: 'student',
  branch_id: 'branch-cse',
  semester_id: 'sem-4',
  section_id: 'sec-a',
  college: 'MAKAUT Affiliated Institute of Technology',
  is_verified: true,
  branch: { id: 'branch-cse', code: 'CSE', name: 'Computer Science & Engineering' },
  semester: { id: 'sem-4', number: 4, branch_id: 'branch-cse', academic_year: '2024-25' },
  section: { id: 'sec-a', code: 'A', semester_id: 'sem-4' },
};

export const MOCK_SUBJECTS: Subject[] = [
  { id: '1', code: 'CS401', name: 'Design & Analysis of Algorithms', credits: 4, faculty_name: 'Dr. Priya Sharma', attendance_percent: 88 },
  { id: '2', code: 'CS402', name: 'Operating Systems', credits: 4, faculty_name: 'Prof. Rajiv Menon', attendance_percent: 92 },
  { id: '3', code: 'CS403', name: 'Computer Networks', credits: 3, faculty_name: 'Dr. Ananya Das', attendance_percent: 76 },
  { id: '4', code: 'CS404', name: 'Database Management Systems', credits: 4, faculty_name: 'Prof. Vikram Singh', attendance_percent: 94 },
  { id: '5', code: 'CS405', name: 'Software Engineering', credits: 3, faculty_name: 'Dr. Meera Iyer', attendance_percent: 85 },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: '1', title: 'Graph Algorithms Lab', subject_id: '1', subject_name: 'DAA', due_date: '2026-05-22T23:59:00Z', priority: 'high', completed: false, progress: 70 },
  { id: '2', title: 'Process Scheduling Report', subject_id: '2', subject_name: 'OS', due_date: '2026-05-25T23:59:00Z', priority: 'medium', completed: false, progress: 35 },
  { id: '3', title: 'TCP/IP Analysis', subject_id: '3', subject_name: 'Networks', due_date: '2026-05-20T23:59:00Z', priority: 'urgent', completed: false, progress: 85 },
  { id: '4', title: 'ER Diagram Project', subject_id: '4', subject_name: 'DBMS', due_date: '2026-05-28T23:59:00Z', priority: 'low', completed: true, progress: 100 },
];

export const MOCK_SCHEDULE: ScheduleSlot[] = [
  { id: '1', subject_name: 'Design & Analysis of Algorithms', subject_code: 'CS401', start_time: '09:00', end_time: '10:00', room: 'Block A · 204', day_of_week: new Date().getDay() },
  { id: '2', subject_name: 'Operating Systems', subject_code: 'CS402', start_time: '10:15', end_time: '11:15', room: 'Block B · Lab 3', day_of_week: new Date().getDay() },
  { id: '3', subject_name: 'Computer Networks', subject_code: 'CS403', start_time: '14:00', end_time: '15:00', room: 'Block A · 108', day_of_week: new Date().getDay() },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Mid-Semester Examination Schedule Released',
    body: 'The mid-semester examinations for CSE 4th semester will commence from June 10. Check the portal for your hall ticket.',
    author_id: 'admin-1',
    author_name: 'Academic Office',
    scope: 'semester',
    priority: 'urgent',
    is_pinned: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: '2',
    title: 'OS Lab — Submission Deadline Extended',
    body: 'The Process Scheduling lab submission deadline has been extended to May 25, 11:59 PM.',
    author_id: 'fac-2',
    author_name: 'Prof. Rajiv Menon',
    scope: 'subject',
    priority: 'high',
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
  {
    id: '3',
    title: 'Tech Fest 2026 — Registration Open',
    body: 'Register your teams for the annual tech fest. Last date: May 30.',
    author_id: 'admin-1',
    author_name: 'Student Affairs',
    scope: 'college',
    priority: 'normal',
    is_pinned: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    read: true,
  },
];

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'DAA Mid-Sem', event_type: 'exam', starts_at: '2026-06-12T10:00:00Z', description: 'Hall A' },
  { id: '2', title: 'Independence Day', event_type: 'holiday', starts_at: '2026-08-15T00:00:00Z' },
  { id: '3', title: 'Tech Fest', event_type: 'fest', starts_at: '2026-06-20T09:00:00Z', description: 'Main Auditorium' },
];

export const MOCK_FACULTY: FacultyMember[] = [
  {
    id: 'f0',
    full_name: 'Dr. Sourav Banerjee',
    designation: 'Principal',
    department: 'Administration',
    email: 'principal@college.edu',
    bio: 'Leading academic excellence since 2018.',
    achievements: ['NAAC A+ Accreditation Lead', '20+ years in academia'],
    is_hod: false,
    is_principal: true,
  },
  {
    id: 'f1',
    full_name: 'Dr. Priya Sharma',
    designation: 'Head of Department',
    department: 'Computer Science & Engineering',
    email: 'hod.cse@college.edu',
    bio: 'Specializes in algorithms and distributed systems.',
    achievements: ['PhD — IIT Kharagpur', '50+ research publications'],
    is_hod: true,
    is_principal: false,
  },
  {
    id: 'f2',
    full_name: 'Prof. Rajiv Menon',
    designation: 'Associate Professor',
    department: 'Computer Science & Engineering',
    email: 'rajiv.menon@college.edu',
    achievements: ['OS & Systems expert', 'Industry consultant'],
    is_hod: false,
    is_principal: false,
  },
  {
    id: 'f3',
    full_name: 'Dr. Ananya Das',
    designation: 'Assistant Professor',
    department: 'Computer Science & Engineering',
    email: 'ananya.das@college.edu',
    achievements: ['Networking & Security researcher'],
    is_hod: false,
    is_principal: false,
  },
];

/** Demo MAKAUT credentials for Expo Go (replace with real API in production) */
export const DEMO_MAKAUT_CREDENTIALS = {
  identifier: '20300120001',
  password: 'makaut123',
} as const;

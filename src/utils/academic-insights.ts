import type { SemesterResult } from '@/hooks/queries/use-results';

export interface BacklogSubject {
  subjectCode: string;
  subjectName: string;
  originalSemester: number;
  clearedSemester?: number;
  currentGrade: string;
  status: 'Active' | 'Cleared';
  totalAttempts: number;
  history: { semester: number; grade: string }[];
}

export interface AcademicTimelineEvent {
  id: string;
  semester: number;
  type: 'ResultPublished' | 'SGPAAvailable' | 'BacklogDetected' | 'BacklogCleared' | 'Milestone';
  title: string;
  description: string;
  timestamp: number; // Abstract timeline sort order since we don't have exact dates
}

export function calculateBacklogs(results: SemesterResult[]) {
  console.log('[BacklogAudit] Starting backlog calculation with', results.length, 'semester records');

  // Process from oldest to newest: reverse original newest-first ordering then stable sort by semester
  const sorted = [...results].reverse().sort((a, b) => a.semester - b.semester);
  
  const subjectHistory = new Map<string, {
    subjectName: string;
    attempts: { semester: number, grade: string, isFail: boolean }[];
  }>();

  sorted.forEach(sem => {
    sem.subjects.forEach(sub => {
      const code = sub.subjectCode;
      const grade = sub.grade.toUpperCase();
      const isFail = grade === 'F' || grade === 'I';
      
      if (!subjectHistory.has(code)) {
        subjectHistory.set(code, {
          subjectName: sub.subjectName,
          attempts: []
        });
      }
      subjectHistory.get(code)!.attempts.push({
        semester: sem.semester,
        grade,
        isFail
      });
    });
  });

  const allBacklogs: BacklogSubject[] = [];

  for (const [code, data] of subjectHistory.entries()) {
    const hasFailed = data.attempts.some(a => a.isFail);
    
    if (hasFailed) {
      const firstFail = data.attempts.find(a => a.isFail)!;
      const hasPassed = data.attempts.some(a => !a.isFail);
      const isActive = !hasPassed;
      
      const latestAttempt = data.attempts[data.attempts.length - 1];
      const currentGrade = hasPassed ? data.attempts.find(a => !a.isFail)!.grade : latestAttempt.grade;
      
      const clearedSemester = isActive 
        ? undefined 
        : data.attempts.find(a => !a.isFail)?.semester;

      console.log(`[BacklogAudit] Subject ${code}: attempts=${data.attempts.length}, hasPassed=${hasPassed}, isActive=${isActive}`);

      allBacklogs.push({
        subjectCode: code,
        subjectName: data.subjectName,
        originalSemester: firstFail.semester,
        clearedSemester: clearedSemester,
        currentGrade: currentGrade,
        status: isActive ? 'Active' : 'Cleared',
        totalAttempts: data.attempts.length,
        history: data.attempts.map(a => ({ semester: a.semester, grade: a.grade }))
      });
    }
  }

  const activeBacklogs = allBacklogs.filter(b => b.status === 'Active');
  const clearedBacklogs = allBacklogs.filter(b => b.status === 'Cleared');

  return {
    allBacklogs,
    activeBacklogs,
    clearedBacklogs,
    totalCount: allBacklogs.length,
    activeCount: activeBacklogs.length,
    clearedCount: clearedBacklogs.length,
  };
}

export function buildAcademicTimeline(results: SemesterResult[]): AcademicTimelineEvent[] {
  const events: AcademicTimelineEvent[] = [];
  // Ensure chronologically older events from the same semester process first
  const sorted = [...results].reverse().sort((a, b) => a.semester - b.semester);
  
  const backlogMap = new Map<string, boolean>();

  sorted.forEach(sem => {
    // 1. Result Published
    events.push({
      id: `sem-${sem.semester}-published`,
      semester: sem.semester,
      type: sem.status === 'Published' ? 'ResultPublished' : 'Milestone',
      title: `Semester ${sem.semester} Result`,
      description: sem.status === 'Published' ? 'Result successfully published' : 'Result is currently processing',
      timestamp: sem.semester * 1000,
    });

    if (sem.status !== 'Published') return;

    // 2. SGPA Available
    if (sem.sgpa !== null) {
      events.push({
        id: `sem-${sem.semester}-sgpa`,
        semester: sem.semester,
        type: 'SGPAAvailable',
        title: `SGPA: ${sem.sgpa.toFixed(2)}`,
        description: `Credits Earned: ${sem.subjects.reduce((sum, s) => sum + s.credit, 0)}`,
        timestamp: sem.semester * 1000 + 10,
      });
    }

    // 3. Backlogs Detected / Cleared
    sem.subjects.forEach((sub, idx) => {
      const code = sub.subjectCode;
      const grade = sub.grade.toUpperCase();
      const isFail = grade === 'F' || grade === 'I';

      if (isFail) {
        if (!backlogMap.get(code)) {
          backlogMap.set(code, true);
          events.push({
            id: `sem-${sem.semester}-backlog-${code}-${idx}`,
            semester: sem.semester,
            type: 'BacklogDetected',
            title: `Backlog Detected`,
            description: `${sub.subjectName} (${code})`,
            timestamp: sem.semester * 1000 + 20 + idx,
          });
        }
      } else {
        if (backlogMap.get(code) === true) {
          backlogMap.set(code, false); // cleared
          events.push({
            id: `sem-${sem.semester}-cleared-${code}-${idx}`,
            semester: sem.semester,
            type: 'BacklogCleared',
            title: `Backlog Cleared`,
            description: `${sub.subjectName} (${code}) passed with ${grade}`,
            timestamp: sem.semester * 1000 + 30 + idx,
          });
        }
      }
    });
  });

  // Re-sort descending for the timeline (newest events at the top)
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

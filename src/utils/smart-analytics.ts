import type { SemesterResult } from '@/hooks/queries/use-results';
import { calculateBacklogs, BacklogSubject } from './academic-insights';

export interface SubjectImprovement {
  subjectCode: string;
  subjectName: string;
  previousGrade: string;
  latestGrade: string;
}

export interface SubjectCategoryPerformance {
  category: string;
  totalCredits: number;
  gradePoints: number; // For average calculation
  subjectCount: number;
}

export interface SmartAnalytics {
  semestersCompleted: number;
  totalSubjects: number;
  activeBacklogsCount: number;
  clearedBacklogsCount: number;
  latestSgpa: number | null;
  bestSgpa: number | null;
  
  performanceTrend: 'Improving' | 'Stable' | 'Declining' | 'Insufficient Data';
  healthScore: number;
  healthStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  
  improvements: SubjectImprovement[];
  insights: string[];
  categories: SubjectCategoryPerformance[];
  badges: string[];
  
  backlogs: BacklogSubject[];
}

const GRADE_POINTS: Record<string, number> = { 'O': 10, 'E': 9, 'A': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0, 'I': 0 };

function categorizeSubject(name: string, code: string): string {
  const lower = name.toLowerCase();
  const lowerCode = code.toLowerCase();
  
  if (lower.includes('lab') || lower.includes('practical') || lowerCode.includes('9')) return 'Laboratories';
  if (lower.includes('math') || lower.includes('calculus') || lower.includes('probability')) return 'Mathematics';
  if (lower.includes('program') || lower.includes('data structure') || lower.includes('algorithm') || lower.includes('software')) return 'Programming';
  if (lower.includes('electronic') || lower.includes('circuit') || lower.includes('digital') || lower.includes('analog')) return 'Electronics';
  if (lower.includes('english') || lower.includes('communication') || lower.includes('value') || lower.includes('management') || lower.includes('humanit')) return 'Humanities';
  if (lower.includes('computer') || lower.includes('os') || lower.includes('network') || lower.includes('database')) return 'Core CS';
  
  return 'Core/Other';
}

export function generateSmartAnalytics(results: SemesterResult[]): SmartAnalytics {
  if (!results || results.length === 0) {
    return {
      semestersCompleted: 0,
      totalSubjects: 0,
      activeBacklogsCount: 0,
      clearedBacklogsCount: 0,
      latestSgpa: null,
      bestSgpa: null,
      performanceTrend: 'Insufficient Data',
      healthScore: 0,
      healthStatus: 'Needs Attention',
      improvements: [],
      insights: [],
      categories: [],
      badges: [],
      backlogs: []
    };
  }

  // Use the robust backlog calculation we already wrote
  const { allBacklogs, activeCount, clearedCount } = calculateBacklogs(results);
  
  // Sort descending for SGPA/Trend extraction
  const sortedDesc = [...results].sort((a, b) => b.semester - a.semester);
  const validSgpas = sortedDesc.filter(r => r.sgpa !== null).map(r => r.sgpa as number);
  
  const semestersCompleted = validSgpas.length;
  const latestSgpa = validSgpas[0] ?? null;
  const bestSgpa = validSgpas.length > 0 ? Math.max(...validSgpas) : null;
  
  // Trend
  let performanceTrend: SmartAnalytics['performanceTrend'] = 'Insufficient Data';
  if (validSgpas.length >= 2) {
    const latest = validSgpas[0];
    const prev = validSgpas[1];
    const diff = latest - prev;
    if (diff > 0.2) performanceTrend = 'Improving';
    else if (diff < -0.2) performanceTrend = 'Declining';
    else performanceTrend = 'Stable';
  }

  // Health Meter: 100 - (15 * active) + (5 * cleared), capped at 100, min 0
  let healthScore = 100 - (15 * activeCount) + (5 * clearedCount);
  healthScore = Math.min(100, Math.max(0, healthScore));
  let healthStatus: SmartAnalytics['healthStatus'] = 'Excellent';
  if (healthScore >= 85) healthStatus = 'Excellent';
  else if (healthScore >= 65) healthStatus = 'Good';
  else if (healthScore >= 40) healthStatus = 'Needs Attention';
  else healthStatus = 'Critical';

  // Improvement Tracker and Category Grouping
  const subjectHistory = new Map<string, { code: string, name: string, grades: string[], credits: number }>();
  let totalSubjects = 0;
  
  // Process ascending for chronological subject history
  const sortedAsc = [...results].sort((a, b) => a.semester - b.semester);
  sortedAsc.forEach(sem => {
    sem.subjects.forEach(sub => {
      totalSubjects++; // total subjects completed (or attempted)
      const code = sub.subjectCode;
      if (!subjectHistory.has(code)) {
        subjectHistory.set(code, { code, name: sub.subjectName, grades: [], credits: sub.credit });
      }
      subjectHistory.get(code)!.grades.push(sub.grade.toUpperCase());
    });
  });

  const improvements: SubjectImprovement[] = [];
  const catMap = new Map<string, SubjectCategoryPerformance>();

  for (const [, data] of subjectHistory.entries()) {
    // 1. Improvements
    if (data.grades.length > 1) {
      const first = data.grades[0];
      const latest = data.grades[data.grades.length - 1];
      const firstPts = GRADE_POINTS[first] ?? 0;
      const latestPts = GRADE_POINTS[latest] ?? 0;
      if (latestPts > firstPts && firstPts > 0) { // must have had a valid starting point that improved
        improvements.push({
          subjectCode: data.code,
          subjectName: data.name,
          previousGrade: first,
          latestGrade: latest,
        });
      } else if (first === 'F' && latestPts > 0) {
        improvements.push({
          subjectCode: data.code,
          subjectName: data.name,
          previousGrade: first,
          latestGrade: latest,
        });
      }
    }

    // 2. Categories (using latest grade)
    const latestGrade = data.grades[data.grades.length - 1];
    const category = categorizeSubject(data.name, data.code);
    if (!catMap.has(category)) {
      catMap.set(category, { category, totalCredits: 0, gradePoints: 0, subjectCount: 0 });
    }
    const cat = catMap.get(category)!;
    cat.subjectCount += 1;
    cat.totalCredits += data.credits;
    cat.gradePoints += (GRADE_POINTS[latestGrade] ?? 0) * data.credits;
  }

  const categories = Array.from(catMap.values()).sort((a, b) => b.subjectCount - a.subjectCount);

  // Insights
  const insights: string[] = [];
  if (clearedCount > 0) insights.push(`${clearedCount} backlog(s) cleared over your academic journey.`);
  if (improvements.length > 0) insights.push(`You have significantly improved in ${improvements.length} subject(s).`);
  
  if (categories.length > 0) {
    // Find best category
    let bestCat = categories[0];
    let bestCatScore = -1;
    let worstCat = categories[0];
    let worstCatScore = 100;
    
    categories.forEach(c => {
      if (c.totalCredits > 0) {
        const score = c.gradePoints / c.totalCredits;
        if (score > bestCatScore) { bestCatScore = score; bestCat = c; }
        if (score < worstCatScore) { worstCatScore = score; worstCat = c; }
      }
    });

    if (bestCatScore >= 8) insights.push(`Strong performance in ${bestCat.category} subjects.`);
    if (worstCatScore <= 6 && worstCat.subjectCount > 1) insights.push(`${worstCat.category} subjects need attention.`);
  }

  // Badges
  const badges: string[] = [];
  if (semestersCompleted >= 1) badges.push('Semester Completed');
  if (activeCount === 0 && semestersCompleted > 0) badges.push('No Active Backlogs');
  if (clearedCount > 0) badges.push('First Backlog Cleared');
  
  const labCat = categories.find(c => c.category === 'Laboratories');
  if (labCat && labCat.subjectCount > 0) {
    // Check if any lab was failed based on allBacklogs map
    const labCodes = Array.from(subjectHistory.values())
      .filter(s => categorizeSubject(s.name, s.code) === 'Laboratories')
      .map(s => s.code);
    
    const anyLabFailed = allBacklogs.some(b => labCodes.includes(b.subjectCode) && b.status === 'Active');
    if (!anyLabFailed) badges.push('All Labs Passed');
  }

  return {
    semestersCompleted,
    totalSubjects,
    activeBacklogsCount: activeCount,
    clearedBacklogsCount: clearedCount,
    latestSgpa,
    bestSgpa,
    performanceTrend,
    healthScore,
    healthStatus,
    improvements,
    insights,
    categories,
    badges,
    backlogs: allBacklogs // Pass this down for the backlog timeline
  };
}

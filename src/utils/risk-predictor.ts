import type { SemesterResult } from '@/hooks/queries/use-results';
import type { InternalMark } from '@/types/internal-marks';
import { calculateBacklogs } from './academic-insights';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface SubjectRisk {
  subjectCode: string;
  subjectName: string;
  caAverage: number | null;
  previousGrade: string | null;
  isActiveBacklog: boolean;
  isRepeat: boolean;
  riskLevel: RiskLevel;
}

export interface RiskAnalysis {
  overallScore: number; // 0-100 (100 = max risk)
  overallLevel: RiskLevel;
  subjects: SubjectRisk[];
  warnings: string[];
}

export function calculateRiskAnalysis(results: SemesterResult[], internalMarks: InternalMark[]): RiskAnalysis | null {
  if (!internalMarks || internalMarks.length === 0) return null;

  // Find the latest semester in internal marks
  const semNumbers = internalMarks.map(m => parseInt(m.semester.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
  if (semNumbers.length === 0) return null;
  
  const currentSemesterNum = Math.max(...semNumbers);
  
  // Filter CA marks for the current semester
  const currentMarks = internalMarks.filter(m => {
    const s = parseInt(m.semester.replace(/\D/g, ''), 10);
    return s === currentSemesterNum;
  });

  const { allBacklogs, activeBacklogs } = calculateBacklogs(results || []);
  const activeCodes = new Set(activeBacklogs.map(b => b.subjectCode));
  const historicalCodes = new Map(allBacklogs.map(b => [b.subjectCode, b]));

  const subjects: SubjectRisk[] = [];
  const warnings: string[] = [];

  let totalRiskWeight = 0;
  let maxPossibleWeight = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;

  currentMarks.forEach(mark => {
    const isLab = mark.subjectName.toLowerCase().includes('lab') || mark.subjectName.toLowerCase().includes('practical');
    
    // Calculate CA/PCA average
    let average: number | null = null;
    if (isLab) {
      const pcas = [mark.pca1, mark.pca2].filter(v => v !== null) as number[];
      if (pcas.length > 0) {
        average = pcas.reduce((a, b) => a + b, 0) / pcas.length;
      }
    } else {
      const cas = [mark.ca1, mark.ca2, mark.ca3, mark.ca4].filter(v => v !== null) as number[];
      if (cas.length > 0) {
        // Usually best of 3 or average of all, let's take average of available
        average = cas.reduce((a, b) => a + b, 0) / cas.length;
      }
    }

    const isActiveBacklog = activeCodes.has(mark.subjectCode);
    const history = historicalCodes.get(mark.subjectCode);
    const isRepeat = !!history;
    const previousGrade = history ? history.currentGrade : null;

    let riskLevel: RiskLevel = 'Low';

    if (average !== null) {
      if (isRepeat) {
        // Stricter thresholds for repeated subjects
        if (average < 14) riskLevel = 'High';
        else if (average < 18) riskLevel = 'Medium';
      } else {
        // Normal thresholds
        if (average < 10) riskLevel = 'High';
        else if (average < 15) riskLevel = 'Medium';
      }
    } else {
      // If no marks yet, check if it's a backlog
      if (isRepeat && isActiveBacklog) {
        riskLevel = 'Medium';
      }
    }

    if (riskLevel === 'High') highRiskCount++;
    if (riskLevel === 'Medium') mediumRiskCount++;

    // Calculate weight for overall score
    const weight = riskLevel === 'High' ? 3 : riskLevel === 'Medium' ? 1 : 0;
    totalRiskWeight += weight;
    maxPossibleWeight += 3;

    subjects.push({
      subjectCode: mark.subjectCode,
      subjectName: mark.subjectName,
      caAverage: average,
      previousGrade,
      isActiveBacklog,
      isRepeat,
      riskLevel,
    });
    
    // Warnings
    if (riskLevel === 'High' && isRepeat) {
      warnings.push(`You are repeating ${mark.subjectName} and current performance is critically low.`);
    } else if (riskLevel === 'High') {
      warnings.push(`${mark.subjectName} requires immediate attention.`);
    }
  });

  // Sort subjects: High -> Medium -> Low
  subjects.sort((a, b) => {
    const val = (r: RiskLevel) => r === 'High' ? 3 : r === 'Medium' ? 2 : 1;
    return val(b.riskLevel) - val(a.riskLevel);
  });

  if (highRiskCount > 0 && highRiskCount + mediumRiskCount >= 2) {
    warnings.push(`${highRiskCount + mediumRiskCount} subjects are at risk of becoming backlogs.`);
  }

  if (activeBacklogs.length > 2) {
    warnings.push(`You have ${activeBacklogs.length} active backlogs compounding your current semester risk.`);
    totalRiskWeight += 2; // Penalty
  }

  let overallScore = maxPossibleWeight > 0 ? (totalRiskWeight / maxPossibleWeight) * 100 : 0;
  overallScore = Math.min(100, Math.max(0, overallScore));

  let overallLevel: RiskLevel = 'Low';
  if (overallScore >= 60 || highRiskCount >= 2) overallLevel = 'High';
  else if (overallScore >= 30 || mediumRiskCount >= 2 || highRiskCount === 1) overallLevel = 'Medium';

  return {
    overallScore,
    overallLevel,
    subjects,
    warnings: Array.from(new Set(warnings)), // deduplicate
  };
}

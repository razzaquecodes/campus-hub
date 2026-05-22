import type { MakautVerifiedProfile } from '@/types/database';

/**
 * Parses MAKAUT roll numbers to auto-detect branch, semester, section.
 * Supports common patterns — extend when college format is confirmed.
 *
 * Examples:
 * - 20300120001 → year 2020, branch CSE, sem 3, section A
 * - CSE/2021/001 → branch CSE, batch 2021
 */
export function parseRollNumber(roll: string): Partial<MakautVerifiedProfile> {
  const normalized = roll.trim().toUpperCase().replace(/\s/g, '');

  // Pattern: 2YYBBBSSEEENNN (11–12 digit MAKAUT-style)
  const numericMatch = normalized.match(/^(\d{2})(\d{2})(\d{2})(\d{1})([A-Z]?)(\d{3,})$/);
  if (numericMatch) {
    const [, , branchCode, semCode, sectionCode] = numericMatch;
    const branchMap: Record<string, { code: string; name: string; dept: string }> = {
      '01': { code: 'CSE', name: 'Computer Science', dept: 'Computer Science & Engineering' },
      '02': { code: 'ECE', name: 'Electronics', dept: 'Electronics & Communication' },
      '03': { code: 'ME', name: 'Mechanical', dept: 'Mechanical Engineering' },
      '04': { code: 'CE', name: 'Civil', dept: 'Civil Engineering' },
      '05': { code: 'IT', name: 'Information Technology', dept: 'Information Technology' },
    };
    const branch = branchMap[branchCode] ?? { code: 'GEN', name: 'General', dept: 'Engineering' };
    const sectionLetters = ['A', 'B', 'C', 'D'];
    const section = sectionLetters[parseInt(sectionCode, 10) - 1] ?? 'A';

    return {
      roll_number: normalized,
      branch_code: branch.code,
      branch_name: branch.name,
      department: branch.dept,
      semester: parseInt(semCode, 10) || 1,
      section,
    };
  }

  // Pattern: CSE2021001 or CSE-2021-001
  const alphaMatch = normalized.match(/^([A-Z]{2,4})[-/]?(\d{4})[-/]?(\d+)$/);
  if (alphaMatch) {
    const [, branchCode, yearStr, num] = alphaMatch;
    const batchYear = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();
    const semester = Math.min(8, Math.max(1, (currentYear - batchYear) * 2));

    return {
      roll_number: normalized,
      branch_code: branchCode,
      branch_name: branchCode,
      department: `${branchCode} Department`,
      semester,
      section: num.endsWith('1') || num.endsWith('2') ? 'A' : 'B',
    };
  }

  return { roll_number: normalized };
}

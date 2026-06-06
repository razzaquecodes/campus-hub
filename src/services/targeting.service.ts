import {
  ACADEMIC_YEARS,
  BRANCH_CODES,
  SECTION_CODES,
  type AcademicYear,
  type AudienceEstimate,
  type AudienceTarget,
  type BranchCode,
  type SectionCode,
  type TargetableProfile,
} from '@/types/targeting';

const DEFAULT_COLLEGE_SIZE = 1200;
const BRANCH_SIZE = Math.round(DEFAULT_COLLEGE_SIZE / BRANCH_CODES.length);
const YEAR_SIZE = Math.round(DEFAULT_COLLEGE_SIZE / ACADEMIC_YEARS.length);
const SECTION_SIZE = Math.round(BRANCH_SIZE / SECTION_CODES.length);

function isBranchCode(value: string): value is BranchCode {
  return (BRANCH_CODES as readonly string[]).includes(value);
}

function isSectionCode(value: string): value is SectionCode {
  return (SECTION_CODES as readonly string[]).includes(value);
}

export function normalizeBranch(value?: string | null): BranchCode | undefined {
  const normalized = (value ?? '').toUpperCase();
  if (isBranchCode(normalized)) return normalized;
  if (normalized.includes('CIVIL')) return 'CE';
  if (normalized.includes('MECHANICAL')) return 'ME';
  if (normalized.includes('ELECTRONICS')) return 'ECE';
  if (normalized.includes('ELECTRICAL')) return 'EE';
  if (normalized.includes('COMPUTER')) return 'CSE';
  return undefined;
}

export function normalizeYear(value?: string | number | null): AcademicYear | undefined {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return ACADEMIC_YEARS.includes(parsed as AcademicYear) ? (parsed as AcademicYear) : undefined;
}

export function normalizeSection(value?: string | null): SectionCode | undefined {
  const normalized = (value ?? '').toUpperCase().slice(0, 1);
  return isSectionCode(normalized) ? normalized : undefined;
}

export function createAudienceTarget(input: AudienceTarget): AudienceTarget {
  if (input.entireCollege) {
    return {
      entireCollege: true,
      allBranches: true,
      allYears: true,
      allSections: true,
    };
  }

  return {
    branch: input.allBranches ? undefined : input.branch,
    year: input.allYears ? undefined : input.year,
    section: input.allSections ? undefined : input.section,
    allBranches: input.allBranches,
    allYears: input.allYears,
    allSections: input.allSections,
    entireCollege: false,
  };
}

export function targetEntireCollege(): AudienceTarget {
  return createAudienceTarget({ entireCollege: true });
}

export function audienceToLabel(target: AudienceTarget): string {
  if (target.entireCollege || (target.allBranches && target.allYears && target.allSections)) {
    return 'Entire College';
  }

  const parts: string[] = [];
  if (target.branch) parts.push(target.branch);
  else if (target.allBranches) parts.push('All Branches');

  if (target.year) {
    const suffix = target.year === 1 ? 'st' : target.year === 2 ? 'nd' : target.year === 3 ? 'rd' : 'th';
    parts.push(`${target.year}${suffix} Year`);
  } else if (target.allYears) {
    parts.push('All Years');
  }

  if (target.section) parts.push(`Section ${target.section}`);
  else if (target.allSections) parts.push('All Sections');

  return parts.length > 0 ? parts.join(' ') : 'Custom Audience';
}

export function estimateAudience(target: AudienceTarget): AudienceEstimate {
  if (target.entireCollege) {
    return { label: audienceToLabel(target), estimatedCount: DEFAULT_COLLEGE_SIZE, target };
  }

  let estimatedCount = DEFAULT_COLLEGE_SIZE;
  if (target.branch) estimatedCount = BRANCH_SIZE;
  if (target.year) estimatedCount = target.branch ? Math.round(BRANCH_SIZE / ACADEMIC_YEARS.length) : YEAR_SIZE;
  if (target.section) estimatedCount = target.branch ? SECTION_SIZE : Math.round(YEAR_SIZE / SECTION_CODES.length);

  return {
    label: audienceToLabel(target),
    estimatedCount: Math.max(24, estimatedCount),
    target,
  };
}

export function matchesAudience(profile: TargetableProfile, target: AudienceTarget): boolean {
  if (target.entireCollege) return true;

  const branch = normalizeBranch(profile.branch);
  const year = normalizeYear(profile.year);
  const section = normalizeSection(profile.section);

  if (target.branch && branch !== target.branch) return false;
  if (target.year && year !== target.year) return false;
  if (target.section && section !== target.section) return false;

  return true;
}

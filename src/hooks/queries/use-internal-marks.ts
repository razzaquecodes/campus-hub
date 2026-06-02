import { useQuery } from '@tanstack/react-query';
import { fetchInternalMarks } from '@/api/internal-marks.api';
import { useStudentStore } from '@/store/student.store';

export const internalMarksKeys = {
  all: ['internal-marks'] as const,
  detail: (rollNumber?: string) => [...internalMarksKeys.all, rollNumber] as const,
};

export function useInternalMarks() {
  const student = useStudentStore((s) => s.student);
  const rollNumber = student?.rollNumber;

  return useQuery({
    queryKey: internalMarksKeys.detail(rollNumber),
    enabled: !!rollNumber,
    queryFn: () => fetchInternalMarks(rollNumber!),
  });
}

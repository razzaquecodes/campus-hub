import { useQuery } from '@tanstack/react-query';
import { fetchCAMarks } from '@/api/ca-marks.api';
import { useStudentStore } from '@/store/student.store';

export const caMarksKeys = {
  all: ['ca-marks'] as const,
  detail: (rollNumber?: string) => [...caMarksKeys.all, rollNumber] as const,
};

export function useCAMarks() {
  const student = useStudentStore((s) => s.student);
  const rollNumber = student?.rollNumber;

  return useQuery({
    queryKey: caMarksKeys.detail(rollNumber),
    enabled: !!rollNumber,
    queryFn: () => fetchCAMarks(rollNumber!),
  });
}

import { useQuery } from '@tanstack/react-query';

import { fetchFaculty } from '@/api/faculty.api';

export function useFaculty(department?: string) {
  return useQuery({
    queryKey: ['faculty', department],
    queryFn: () => fetchFaculty(department),
  });
}

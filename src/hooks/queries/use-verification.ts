import { useQuery } from '@tanstack/react-query';
import { fetchVerificationDetails } from '@/api/verification.api';

export const verificationKeys = {
  all: ['verification'] as const,
  detail: (rollNumber: string) => [...verificationKeys.all, rollNumber] as const,
};

export function useVerification(rollNumber: string) {
  return useQuery({
    queryKey: verificationKeys.detail(rollNumber),
    enabled: !!rollNumber,
    queryFn: () => fetchVerificationDetails(rollNumber),
    retry: 1,
  });
}

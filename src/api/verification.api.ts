import { Env } from '@/lib/env';

export interface VerificationDetails {
  photoUrl: string;
  name: string;
  rollNumber: string;
  registrationNumber: string;
  department: string;
  currentSemester: string;
  isVerified: boolean;
}

export async function fetchVerificationDetails(rollNumber: string): Promise<VerificationDetails> {
  const baseUrl = (Env.makautVerifyUrl || '').replace(/\/$/, '');
  const url = `${baseUrl}/student/${rollNumber}/verify`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch verification details');
  }

  const json = await response.json();
  
  if (json.success === false) {
    throw new Error(json.message || 'Verification failed');
  }

  return {
    photoUrl: json.data?.photoUrl || json.photoUrl || '',
    name: json.data?.name || json.name || '',
    rollNumber: json.data?.rollNumber || json.rollNumber || rollNumber,
    registrationNumber: json.data?.registrationNumber || json.registrationNumber || '',
    department: json.data?.department || json.department || '',
    currentSemester: json.data?.currentSemester || json.currentSemester || '',
    isVerified: json.data?.isVerified ?? json.isVerified ?? true,
  };
}

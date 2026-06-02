// app/verify/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { VerificationScreen } from '@/screens/verification-screen';

export default function VerifyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VerificationScreen id={id} />;
}

import { AuthGuard } from '@/navigation/auth-guard';
import { AttendanceScreen } from '@/screens/attendance-screen';

export default function AttendanceRoute() {
  return (
    <AuthGuard>
      <AttendanceScreen />
    </AuthGuard>
  );
}

import { useState, useCallback } from 'react';

import { MOCK_ASSIGNMENTS } from '@/constants/mock-data';
import type { Assignment } from '@/types/database';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);

  const toggleComplete = useCallback((id: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, completed: !a.completed, progress: a.completed ? a.progress : 100 }
          : a,
      ),
    );
  }, []);

  const pending = assignments.filter((a) => !a.completed);
  const completed = assignments.filter((a) => a.completed);

  return { assignments, pending, completed, toggleComplete };
}

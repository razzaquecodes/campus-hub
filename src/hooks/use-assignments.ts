import { useCallback, useMemo } from 'react';

import { useAssignmentsDb, useToggleAssignment } from '@/hooks/queries/use-assignments-db';

export function useAssignments() {
  const { data: assignments = [] } = useAssignmentsDb();
  const toggleAssignment = useToggleAssignment();

  const toggleComplete = useCallback(
    (id: string) => {
      const assignment = assignments.find((item) => item.id === id);
      if (!assignment) return;
      toggleAssignment.mutate({ assignmentId: id, completed: !assignment.completed });
    },
    [assignments, toggleAssignment],
  );

  const pending = useMemo(() => assignments.filter((a) => !a.completed), [assignments]);
  const completed = useMemo(() => assignments.filter((a) => a.completed), [assignments]);

  return { assignments, pending, completed, toggleComplete };
}

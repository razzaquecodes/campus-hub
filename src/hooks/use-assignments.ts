import { useState, useCallback, useMemo } from 'react';

import type { Assignment } from '@/types/database';
import { useFacultyStore } from '@/store/faculty.store';
import { useAuthStore } from '@/store/auth.store';

export function useAssignments() {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  
  const { activeAssignments } = useFacultyStore();
  const profile = useAuthStore((s) => s.profile);

  const toggleComplete = useCallback((id: string) => {
    setCompletedIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Map the global Faculty assignments to the local student view
  const assignments: Assignment[] = useMemo(() => {
    return activeAssignments
      .filter((a) => {
        if (a.target.isAll) return true;
        const bMatch = !a.target.branch || a.target.branch === profile?.branch;
        const semMatch = !a.target.semester || a.target.semester === profile?.semester;
        const secMatch = !a.target.section || a.target.section === profile?.section;
        return bMatch && semMatch && secMatch;
      })
      .map((a) => {
        const isCompleted = completedIds.includes(a.id);
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          subject_id: a.subject_name.toLowerCase().replace(/ /g, '-'),
          subject_name: a.subject_name,
          due_date: a.due_date,
          priority: a.priority,
          completed: isCompleted,
          progress: isCompleted ? 100 : 0,
        };
      });
  }, [activeAssignments, profile, completedIds]);

  const pending = useMemo(() => assignments.filter((a) => !a.completed), [assignments]);
  const completed = useMemo(() => assignments.filter((a) => a.completed), [assignments]);

  return { assignments, pending, completed, toggleComplete };
}

import { supabase } from '@/lib/supabase';

export interface AuditLogEntry {
  action: string;
  studentId?: string;
  sessionId?: string;
  details?: string;
}

export class AuditRepository {
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabase.from('audit_logs').insert([
        {
          action: entry.action,
          student_id: entry.studentId,
          session_id: entry.sessionId,
          details: entry.details,
          created_at: new Date().toISOString()
        }
      ]);
      
      if (error) {
        console.error('[AuditRepository] Failed to insert audit log:', error);
      }
    } catch (err) {
      console.error('[AuditRepository] Error logging audit:', err);
    }
  }
}
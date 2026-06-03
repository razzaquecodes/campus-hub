import { createClient } from '@/lib/supabase/server'
import { Search, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'

export default async function StudentsPage({
  searchParams
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q || ''

  let sbQuery = supabase.from('student_profiles').select('*').order('created_at', { ascending: false }).limit(50)

  if (query) {
    sbQuery = sbQuery.or(`full_name.ilike.%${query}%,roll_number.ilike.%${query}%`)
  }

  const { data: students, error } = await sbQuery

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Student Directory</h1>
          <p className="text-white/60">Manage and view all onboarded students.</p>
        </div>
        
        <form className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name or roll number..."
            className="w-full rounded-xl border border-white/10 bg-[#0F0F0F] pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </form>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="border-b border-white/10 bg-black/20 text-xs uppercase text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Roll Number</th>
                <th className="px-6 py-4 font-medium">Branch</th>
                <th className="px-6 py-4 font-medium">Semester</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0F0F0F]">
              {students?.map((student) => (
                <tr key={student.user_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        {student.avatar_url ? (
                           <img src={student.avatar_url} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">{student.full_name}</div>
                        <div className="text-xs text-white/40">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{student.roll_number}</td>
                  <td className="px-6 py-4">{student.branch || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                      Sem {student.semester || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/students/${student.roll_number}`}
                      className="inline-flex items-center justify-center rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {(!students || students.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    No students found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

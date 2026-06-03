import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, GraduationCap, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function StudentDetailsPage({
  params
}: {
  params: { rollNumber: string }
}) {
  const supabase = await createClient()

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('roll_number', params.rollNumber)
    .single()

  if (!profile) {
    notFound()
  }

  // 2. Fetch Academic Results
  const { data: results } = await supabase
    .from('academic_results')
    .select('*')
    .eq('roll_number', params.rollNumber)
    .order('semester', { ascending: false })

  // 3. Fetch Internal Marks
  const { data: internalMarks } = await supabase
    .from('internal_marks')
    .select('*')
    .eq('roll_number', params.rollNumber)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/students" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{profile.full_name}</h1>
            <p className="text-white/60 text-lg">{profile.roll_number} • {profile.branch}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Student Information</h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between border-b border-white/5 pb-4">
              <span className="text-white/40">Email</span>
              <span className="text-white font-medium">{profile.email}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-4">
              <span className="text-white/40">Phone</span>
              <span className="text-white font-medium">{profile.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-4">
              <span className="text-white/40">Semester</span>
              <span className="text-white font-medium">{profile.semester || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-4">
              <span className="text-white/40">Section / Batch</span>
              <span className="text-white font-medium">{profile.section || 'N/A'} • {profile.batch || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Academic Results Card */}
        <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Semester Results</h2>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {results && results.length > 0 ? (
              <div className="flex flex-col gap-3">
                {results.map((res) => (
                  <div key={res.semester} className="flex justify-between items-center rounded-xl bg-white/[0.02] p-4 border border-white/5">
                    <div>
                      <span className="text-white font-medium block">Semester {res.semester}</span>
                      <span className="text-xs text-white/40">Credits: {res.total_credits}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400 block">{res.sgpa} SGPA</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center py-10 text-white/40">No academic results synced.</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Internal Marks Summary */}
      <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Internal Assessments Overview</h2>
          <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
             <FileText className="h-4 w-4 text-amber-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {internalMarks && internalMarks.length > 0 ? (
            <table className="w-full text-left text-sm text-white/70">
              <thead className="border-b border-white/10 text-xs uppercase text-white/40">
                <tr>
                  <th className="pb-3 font-medium">Subject Code</th>
                  <th className="pb-3 font-medium">Subject Name</th>
                  <th className="pb-3 font-medium">CA 1</th>
                  <th className="pb-3 font-medium">CA 2</th>
                  <th className="pb-3 font-medium">CA 3</th>
                  <th className="pb-3 font-medium">CA 4</th>
                  <th className="pb-3 font-medium">PCA 1</th>
                  <th className="pb-3 font-medium">PCA 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {internalMarks.map((mark) => (
                   <tr key={mark.subject_code} className="hover:bg-white/[0.02] transition-colors">
                     <td className="py-3 font-mono text-xs">{mark.subject_code}</td>
                     <td className="py-3 font-medium text-white">{mark.subject_name}</td>
                     <td className="py-3">{mark.ca1_marks ?? '-'}</td>
                     <td className="py-3">{mark.ca2_marks ?? '-'}</td>
                     <td className="py-3">{mark.ca3_marks ?? '-'}</td>
                     <td className="py-3">{mark.ca4_marks ?? '-'}</td>
                     <td className="py-3">{mark.pca1_marks ?? '-'}</td>
                     <td className="py-3">{mark.pca2_marks ?? '-'}</td>
                   </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10 text-white/40">No internal marks synced.</div>
          )}
        </div>
      </div>

    </div>
  )
}

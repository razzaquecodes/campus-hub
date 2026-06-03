import { createClient } from '@/lib/supabase/server'
import { Users, GraduationCap, FileText, Database } from 'lucide-react'

// Dummy Chart Component just for Visuals in MVP
function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
      <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6">User Onboarding Trend</h3>
        <div className="h-64 w-full flex items-end justify-between gap-2 px-2 pb-2 border-b border-white/10">
          {/* Mock Bar Chart */}
          {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
            <div key={i} className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 rounded-t-sm relative group cursor-pointer transition-colors" style={{ height: `${h}%` }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                {h * 12} Users
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/40 px-2">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6">API Data Fetched</h3>
        <div className="h-64 w-full flex items-end justify-between gap-2 px-2 pb-2 border-b border-white/10">
          {/* Mock Bar Chart */}
          {[90, 85, 95, 80, 70, 100, 60].map((h, i) => (
            <div key={i} className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 rounded-t-sm relative group cursor-pointer transition-colors" style={{ height: `${h}%` }}>
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                {h * 24} Req
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/40 px-2">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: studentCount },
    { count: resultsCount },
    { count: internalCount }
  ] = await Promise.all([
    supabase.from('student_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('academic_results').select('*', { count: 'exact', head: true }),
    supabase.from('internal_marks').select('*', { count: 'exact', head: true })
  ])

  const stats = [
    {
      name: 'Total Students',
      value: studentCount ?? 0,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20'
    },
    {
      name: 'Results Stored',
      value: resultsCount ?? 0,
      icon: GraduationCap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      name: 'Internal Marks Records',
      value: internalCount ?? 0,
      icon: FileText,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      name: 'Total DB Records',
      value: (studentCount || 0) + (resultsCount || 0) + (internalCount || 0),
      icon: Database,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Overview</h1>
        <p className="text-white/60">Key metrics and analytics for Campus Hub.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors cursor-default"
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${stat.bg} blur-2xl group-hover:blur-3xl transition-all`} />
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} border ${stat.border}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">{stat.name}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DashboardCharts />
    </div>
  )
}

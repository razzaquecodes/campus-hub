import { Activity, Server, Database, ShieldAlert, Cpu } from 'lucide-react'

export default function MonitoringPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Health & Monitoring</h1>
        <p className="text-white/60">Live telemetry, audit logs, and infrastructure status.</p>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Server className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400/70">Main Backend API</p>
            <p className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Operational
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Database className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400/70">Supabase Database</p>
            <p className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Healthy
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Cpu className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400/70">MAKAUT Scraper Engine</p>
            <p className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Active
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Logs Console */}
        <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-0 shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 bg-black/40 px-6 py-4 border-b border-white/5">
             <ShieldAlert className="h-5 w-5 text-red-400" />
             <h2 className="text-lg font-semibold text-white">System Error Logs</h2>
          </div>
          <div className="flex-1 bg-black/20 p-6 font-mono text-xs text-white/70 h-80 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <div className="text-white/40">[2026-06-03 14:02:11] INFO: Sync worker started</div>
              <div className="text-white/40">[2026-06-03 14:02:15] INFO: Results synced for 256 students</div>
              <div className="text-red-400">[2026-06-03 14:15:32] ERROR: Timeout fetching CA marks for roll 27600124010</div>
              <div className="text-amber-400">[2026-06-03 14:30:00] WARN: MAKAUT portal response time > 5000ms</div>
              <div className="text-white/40">[2026-06-03 14:45:00] INFO: Background task 452 completed</div>
            </div>
          </div>
        </div>

        {/* Security Audit */}
        <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-0 shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 bg-black/40 px-6 py-4 border-b border-white/5">
             <Activity className="h-5 w-5 text-indigo-400" />
             <h2 className="text-lg font-semibold text-white">Admin Audit Trail</h2>
          </div>
          <div className="flex-1 bg-[#0F0F0F] p-6 text-sm text-white/70 h-80 overflow-y-auto">
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <span className="text-white font-medium block">Admin Logged In</span>
                    <span className="text-xs text-white/40">IP: 192.168.1.5 • Safari Mac</span>
                  </div>
                  <span className="text-xs text-white/40">Just now</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <span className="text-white font-medium block">Global Notification Dispatched</span>
                    <span className="text-xs text-white/40">"Results Declared" by admin@campushub.app</span>
                  </div>
                  <span className="text-xs text-white/40">2 hrs ago</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <span className="text-white font-medium block">Notice Pinned</span>
                    <span className="text-xs text-white/40">"Holiday Schedule" by admin@campushub.app</span>
                  </div>
                  <span className="text-xs text-white/40">1 day ago</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

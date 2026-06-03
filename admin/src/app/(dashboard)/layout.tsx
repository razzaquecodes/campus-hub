import { Sidebar } from '@/components/Sidebar'
import { Bell } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Ambient glow in background */}
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
        
        <header className="flex h-20 items-center justify-between border-b border-white/5 px-8 backdrop-blur-md bg-black/50 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Admin Portal</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-600 border border-indigo-400/30 flex items-center justify-center">
              <span className="text-xs font-bold text-white">AD</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 z-10">
          {children}
        </main>
      </div>
    </div>
  )
}

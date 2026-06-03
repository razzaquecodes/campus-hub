'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  BellRing, 
  FileText, 
  Activity, 
  Settings, 
  LogOut 
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Notifications', href: '/notifications', icon: BellRing },
  { name: 'Notices', href: '/notices', icon: FileText },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-[#080808] border-r border-white/5 shadow-2xl">
      <div className="flex h-20 items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <LayoutDashboard className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Campus Hub</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="flex flex-col gap-1.5">
          <div className="mb-2 px-2 text-xs font-semibold tracking-wider text-white/30 uppercase">
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-indigo-400" : "text-white/40 group-hover:text-white/70"
                )} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-white/5 p-4">
        <Link 
          href="/login?logout=true" 
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400/70 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Link>
      </div>
    </div>
  )
}

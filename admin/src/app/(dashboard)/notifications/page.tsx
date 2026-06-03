import { createClient } from '@/lib/supabase/server'
import { BellRing, Send, Search } from 'lucide-react'

export default async function NotificationsPage() {
  const supabase = await createClient()

  // Fetch recent notifications sent
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Column: Create Notification */}
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Push Notifications</h1>
          <p className="text-white/60">Dispatch global or targeted alerts to student devices.</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-6">Compose Alert</h2>
          <form className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70">Notification Title</label>
              <input
                type="text"
                className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="e.g. 5th Semester Results Declared"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70">Message Body</label>
              <textarea
                rows={4}
                className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                placeholder="Enter the main content of your push notification..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70">Target Audience</label>
              <select className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none">
                <option value="all">Global (All Students)</option>
                <option value="semester_5">5th Semester Only</option>
                <option value="cse">CSE Department Only</option>
              </select>
            </div>

            <button
              type="button"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
              Dispatch Notification
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: History */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="lg:mt-[4.5rem] rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl flex flex-col h-[600px]">
          <h2 className="text-lg font-semibold text-white mb-4">Dispatch History</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
            {notifications?.map((notif) => (
              <div key={notif.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{notif.title}</h4>
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">{notif.body}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
                       <span className="uppercase">{notif.type}</span>
                       <span>{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!notifications || notifications.length === 0) && (
               <div className="text-center py-10 text-white/40 text-sm">
                 No notifications in history.
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

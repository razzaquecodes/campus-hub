import { createClient } from '@/lib/supabase/server'
import { FileText, Plus, Pin, AlertCircle } from 'lucide-react'

export default async function NoticesPage() {
  const supabase = await createClient()

  // Fetch notices (announcements)
  const { data: notices } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Notice Board CMS</h1>
          <p className="text-white/60">Create, edit, and manage university announcements.</p>
        </div>
        
        <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
          <Plus className="h-4 w-4" />
          Create Notice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {notices?.map((notice) => (
          <div key={notice.id} className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-6 shadow-xl relative overflow-hidden group">
            {notice.is_pinned && (
              <div className="absolute right-0 top-0 h-16 w-16 overflow-hidden">
                <div className="absolute right-[-20px] top-[14px] w-[80px] rotate-45 bg-amber-500/80 py-1 text-center shadow-md">
                   <Pin className="h-3 w-3 text-white inline-block mb-1" />
                </div>
              </div>
            )}
            
            <div className="mb-4 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                notice.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                notice.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {notice.priority.toUpperCase()}
              </span>
              <span className="text-xs text-white/40">{new Date(notice.created_at).toLocaleDateString()}</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 pr-6 line-clamp-1">{notice.title}</h3>
            <p className="text-sm text-white/60 line-clamp-3 mb-6">{notice.body}</p>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
               <div className="text-xs text-white/40">Scope: <span className="text-white/80 capitalize">{notice.scope}</span></div>
               <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Edit Notice</button>
            </div>
          </div>
        ))}
        {(!notices || notices.length === 0) && (
          <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/40">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No notices have been published yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

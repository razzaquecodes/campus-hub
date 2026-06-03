import { login } from './actions'
import { Shield } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error: string }
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
      
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Shield className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campus Hub Admin</h1>
          <p className="text-white/60">Secure access to the university ecosystem</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0F0F0F] p-8 shadow-2xl backdrop-blur-xl">
          <form className="flex flex-col gap-5">
            {searchParams?.error && (
              <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
                <p className="text-sm text-red-400">{searchParams.error}</p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70" htmlFor="email">
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue="admin@campushub.app"
                required
                className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="admin@university.edu"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/70" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                defaultValue="admin123"
                required
                className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <button
              formAction={login}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98]"
            >
              Authenticate to Portal
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-xs text-white/40">
          Unauthorised access is strictly prohibited. Activity is logged.
        </p>
      </div>
    </div>
  )
}

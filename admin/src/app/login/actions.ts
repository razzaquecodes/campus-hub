'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // For this prototype, we'll implement a simple master password approach 
  // since a dedicated Supabase Admin table doesn't exist yet, OR we can use standard auth:
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Simple override for bootstrapping
  if (email === 'admin@campushub.app' && password === 'admin123') {
    // Generate a dummy session cookie manually for the sake of the demo, 
    // but typically we'd do a supabase.auth.signInWithPassword.
    // For now, let's attempt real supabase auth:
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // If the admin user doesn't exist in Supabase yet, we'll bypass it for demo purposes.
      // In a real production app, we'd return the error.
      // We will set a fake admin cookie to allow access to the dashboard.
      const cookieStore = require('next/headers').cookies
      const cookies = await cookieStore()
      cookies.set('campus_admin_session', 'true', { path: '/' })
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      redirect('/login?error=Invalid credentials')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

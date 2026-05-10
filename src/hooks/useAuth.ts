import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AdminCheckError = 'forbidden' | 'unknown'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AdminCheckError | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) verifyAdmin(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAdmin(false)
      setError(null)
      if (session?.user) verifyAdmin(session.user)
      else setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function verifyAdmin(authUser: User) {
    const { data, error: queryError } = await supabase
      .from('app_admins')
      .select('auth_user_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (queryError) {
      setError('unknown')
      setLoading(false)
      return
    }

    if (data) {
      setIsAdmin(true)
      setError(null)
    } else {
      setError('forbidden')
      setIsAdmin(false)
    }
    setLoading(false)
  }

  return {
    user,
    isAdmin,
    loading,
    error,
    signOut: () => supabase.auth.signOut(),
  }
}

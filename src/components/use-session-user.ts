'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook de sessão tipado: retorna o usuário autenticado (ou null).
 * Reage a login, logout e refresh de token via onAuthStateChange.
 */
export function useSessionUser(): User | null {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let ignore = false

    supabase.auth.getUser().then(({ data }) => {
      if (!ignore) setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) setUser(session?.user ?? null)
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  return user
}
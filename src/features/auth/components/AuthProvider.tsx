import { createContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login as loginApi } from '@/features/auth/services/auth.api'
import { storage } from '@/lib/storage'
import type { AuthUser } from '@/types/api'

type AuthContextType = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: { username: string; password: string }) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      const token = storage.getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch {
        storage.clearAccessToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login: async ({ username, password }) => {
      const result = await loginApi({ username, password })
      storage.setAccessToken(result.accessToken)
      setUser(result.user)
    },
    logout: () => {
      storage.clearAccessToken()
      setUser(null)
    },
  }), [isLoading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

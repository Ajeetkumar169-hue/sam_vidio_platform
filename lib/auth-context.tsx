"use client"

import { createContext, useContext, useCallback, useMemo } from "react"
import useSWR from "swr"

interface UserData {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
  galleryImages?: string[]
  channel?: {
    id: string
    name: string
    slug: string
    logo: string
  } | null
}

interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string, dateOfBirth: string, phoneNumber?: string, gender?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refresh: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, mutate, isLoading } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  const user: UserData | null = data?.user || null

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) return { success: false, error: data.error }
        await mutate()
        return { success: true }
      } catch {
        return { success: false, error: "Network error" }
      }
    },
    [mutate]
  )

  const register = useCallback(
    async (username: string, email: string, password: string, dateOfBirth: string, phoneNumber?: string, gender?: string) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, dateOfBirth, phoneNumber, gender }),
        })
        const data = await res.json()
        if (!res.ok) return { success: false, error: data.error }
        await mutate()
        return { success: true }
      } catch {
        return { success: false, error: "Network error" }
      }
    },
    [mutate]
  )

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await mutate({ user: null }, false)
  }, [mutate])

  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refresh }),
    [user, isLoading, login, register, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

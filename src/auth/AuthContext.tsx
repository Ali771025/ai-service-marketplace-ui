import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { findUserById, findUserByLogin, registerMockUser } from './users'
import {
  homeForUser,
  type AppRole,
  type AuthSession,
  type MockUser,
} from './types'

const STORAGE_KEY = 'portfolio-mock-auth'

type AuthContextValue = {
  user: MockUser | null
  activeRole: AppRole | null
  isAuthenticated: boolean
  login: (login: string, password: string) => { ok: true } | { ok: false; message: string }
  register: (input: {
    displayName: string
    email: string
    username: string
    password: string
  }) => { ok: true } | { ok: false; message: string }
  logout: () => void
  setActiveRole: (role: AppRole) => void
  homePath: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    const user = findUserById(parsed.userId)
    if (!user) return null
    if (!user.roles.includes(parsed.activeRole)) {
      return { userId: user.id, activeRole: user.defaultRole }
    }
    return parsed
  } catch {
    return null
  }
}

function writeSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())

  const user = session ? findUserById(session.userId) ?? null : null
  const activeRole = session && user ? session.activeRole : null

  const login = useCallback((loginValue: string, password: string) => {
    const found = findUserByLogin(loginValue, password)
    if (!found) {
      return { ok: false as const, message: 'نام کاربری یا رمز عبور نادرست است.' }
    }
    const next: AuthSession = {
      userId: found.id,
      activeRole: found.defaultRole,
    }
    writeSession(next)
    setSession(next)
    return { ok: true as const }
  }, [])

  const register = useCallback(
    (input: {
      displayName: string
      email: string
      username: string
      password: string
    }) => {
      const result = registerMockUser(input)
      if (!result.ok) return result
      const next: AuthSession = {
        userId: result.user.id,
        activeRole: result.user.defaultRole,
      }
      writeSession(next)
      setSession(next)
      return { ok: true as const }
    },
    [],
  )

  const logout = useCallback(() => {
    writeSession(null)
    setSession(null)
  }, [])

  const setActiveRole = useCallback(
    (role: AppRole) => {
      if (!session || !user?.roles.includes(role)) return
      const next = { ...session, activeRole: role }
      writeSession(next)
      setSession(next)
    },
    [session, user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      activeRole,
      isAuthenticated: Boolean(user && activeRole),
      login,
      register,
      logout,
      setActiveRole,
      homePath: user ? homeForUser(user) : '/login',
    }),
    [user, activeRole, login, register, logout, setActiveRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

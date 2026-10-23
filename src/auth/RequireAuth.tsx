import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import type { AppRole } from './types'
import { homeForUser } from './types'

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode
  /** اگر مشخص شود، کاربر باید حداقل یکی از این نقش‌ها را داشته باشد */
  roles?: AppRole[]
}) {
  const { isAuthenticated, user, activeRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !user || !activeRole) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.some((r) => user.roles.includes(r))) {
    return <Navigate to={homeForUser(user)} replace />
  }

  return children
}

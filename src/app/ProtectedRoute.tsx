import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { hasRole } from '@/features/auth/authz'

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: readonly string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-50">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !hasRole(user?.role, allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

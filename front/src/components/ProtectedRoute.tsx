import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children?: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#16171d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirige a /login
    return <Navigate to="/login" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

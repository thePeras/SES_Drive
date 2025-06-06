import { Navigate, useLocation } from "react-router-dom"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const username = localStorage.getItem('username')

  if (!username) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <>{children}</>
} 
import { Navigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

interface AdminRouteProps {
  children: React.ReactNode
}

const ADMIN_EMAIL = "chandana66266@gmail.com"

function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth()

  // Wait for Firebase authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Checking authentication...
        </p>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but not admin
  if (user.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />
  }

  // Admin
  return <>{children}</>
}

export default AdminRoute
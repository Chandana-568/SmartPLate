import { Navigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

interface AdminRouteProps {
  children: React.ReactNode
}

// Admin = users/{uid}.role === "admin", or an email in ADMIN_EMAILS
function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, loading } = useAuth()

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
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default AdminRoute

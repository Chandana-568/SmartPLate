import { Navigate } from "react-router-dom"

import { useAuth } from "../context/auth"
import { homeForRole } from "../services/userService"

// /start: sends a freshly logged-in user to the right page for their role
function RoleRedirect() {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your account...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Navigate to={homeForRole(role)} replace />
}

export default RoleRedirect

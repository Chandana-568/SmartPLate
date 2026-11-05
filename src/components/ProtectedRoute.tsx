import { Navigate } from "react-router-dom"

import { useAuth } from "../context/auth"
import { homeForRole } from "../services/userService"
import type { Role } from "../types"

interface ProtectedRouteProps {
  children: React.ReactNode
  // Roles allowed on this page. Omit to allow any signed-in user.
  // Admins are always allowed.
  roles?: Role[]
}

function ProtectedRoute({
  children,
  roles,
}: ProtectedRouteProps) {
  const { user, profile, role, isAdmin, loading } = useAuth()

  // Wait for Firebase to check authentication + load the profile
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Checking authentication...
        </p>
      </div>
    )
  }

  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but has not picked a role yet
  if (!profile && !isAdmin) {
    return <Navigate to="/onboarding" replace />
  }

  // Wrong role for this page: send them to their own home
  if (roles && !isAdmin && (!role || !roles.includes(role))) {
    return <Navigate to={homeForRole(role)} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

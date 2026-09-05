import { Navigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Wait for Firebase to check authentication
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

  // User is logged in
  return <>{children}</>
}

export default ProtectedRoute
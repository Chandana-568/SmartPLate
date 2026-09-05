import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"

import { auth } from "../firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined)

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    )
  }

  return context
}
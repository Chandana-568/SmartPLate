import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"

import { auth, db } from "../firebase"
import type { Role, UserProfile } from "../types"

// Bootstrap admin: this account is treated as admin even before
// its users/{uid} document has role "admin". Keep in sync with firestore.rules.
export const ADMIN_EMAILS = ["chandana66266@gmail.com"]

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  role: Role | null
  isAdmin: boolean
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
        setProfileLoading(Boolean(currentUser))
        setAuthLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Live profile document: users/{uid}
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        setProfile(
          snapshot.exists()
            ? ({ uid: snapshot.id, ...snapshot.data() } as UserProfile)
            : null
        )
        setProfileLoading(false)
      },
      (error) => {
        console.error("Profile load error:", error)
        setProfile(null)
        setProfileLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const isAdmin =
    profile?.role === "admin" ||
    (user?.email != null && ADMIN_EMAILS.includes(user.email))

  const role: Role | null = isAdmin ? "admin" : profile?.role ?? null

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        loading: authLoading || profileLoading,
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

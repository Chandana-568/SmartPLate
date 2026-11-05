import { useEffect, useState } from "react"

import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"

import { auth, db } from "../firebase"
import type { Role, UserProfile } from "../types"
import { ADMIN_EMAILS, AuthContext } from "./auth"

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      // Signed out: clear the profile here, in the auth callback
      if (!currentUser) setProfile(null)
      setProfileLoading(Boolean(currentUser))
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Live profile document: users/{uid}
  useEffect(() => {
    if (!user) return

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

  // Bootstrap admins may have no users/{uid} doc: give them an in-memory one
  // so actions that need a name (claim, pickup) still work.
  const effectiveProfile: UserProfile | null =
    profile ??
    (isAdmin && user
      ? {
          uid: user.uid,
          name: user.displayName || "SharePlate Admin",
          email: user.email ?? "",
          role: "admin",
          orgName: "SharePlate Admin",
          phone: "",
          createdAt: 0,
        }
      : null)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: effectiveProfile,
        role,
        isAdmin,
        loading: authLoading || profileLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

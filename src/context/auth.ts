import { createContext, useContext } from "react"

import type { User } from "firebase/auth"

import type { Role, UserProfile } from "../types"

// Bootstrap admin: this account is treated as admin even before
// its users/{uid} document has role "admin". Keep in sync with firestore.rules.
export const ADMIN_EMAILS = ["chandana66266@gmail.com"]

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  role: Role | null
  isAdmin: boolean
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}

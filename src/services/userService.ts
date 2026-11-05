import { doc, setDoc } from "firebase/firestore"
import type { User } from "firebase/auth"

import { db } from "../firebase"
import type { Role, UserProfile } from "../types"

export async function createUserProfile(
  user: User,
  details: {
    name: string
    role: Exclude<Role, "admin">
    orgName?: string
    phone?: string
  }
) {
  const profile: Omit<UserProfile, "uid"> = {
    name: details.name.trim(),
    email: user.email ?? "",
    role: details.role,
    orgName: details.orgName?.trim() ?? "",
    phone: details.phone?.trim() ?? "",
    createdAt: Date.now(),
  }

  await setDoc(doc(db, "users", user.uid), profile)
}

// Where each role lands after login
export function homeForRole(role: Role | null): string {
  switch (role) {
    case "donor":
      return "/my-donations"
    case "ngo":
      return "/food"
    case "volunteer":
      return "/my-rescues"
    case "admin":
      return "/admin"
    default:
      return "/onboarding"
  }
}

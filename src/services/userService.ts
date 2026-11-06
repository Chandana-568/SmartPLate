import { doc, getDoc, setDoc } from "firebase/firestore"
import type { User } from "firebase/auth"

import { db } from "../firebase"
import type { RecyclerType, Role, UserProfile } from "../types"

export async function createUserProfile(
  user: User,
  details: {
    name: string
    role: Exclude<Role, "admin">
    orgName?: string
    phone?: string
    recyclerType?: RecyclerType
  }
) {
  const profile: Omit<UserProfile, "uid"> = {
    name: details.name.trim(),
    email: user.email ?? "",
    role: details.role,
    orgName: details.orgName?.trim() ?? "",
    phone: details.phone?.trim() ?? "",
    createdAt: Date.now(),
    ...(details.role === "recycler" ? { recyclerType: details.recyclerType ?? "compost" } : {}),
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
    case "recycler":
      return "/expired"
    case "admin":
      return "/admin"
    default:
      return "/onboarding"
  }
}

// Donor's phone / email, shown only to poultry, compost and biogas units
// (and admins) collecting expired food
export async function getContact(uid: string) {
  const snap = await getDoc(doc(db, "users", uid))
  const data = snap.exists() ? (snap.data() as Partial<UserProfile>) : {}
  return { phone: data.phone ?? "", email: data.email ?? "" }
}

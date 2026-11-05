export type Urgency = "low" | "medium" | "high"

export type FoodStatus =
  | "available"
  | "claimed"
  | "picked-up"
  | "completed"

export type Role = "donor" | "ngo" | "volunteer" | "admin"

// Roles a user may pick for themselves at sign-up.
// "admin" is only granted from the Firebase console.
export const SELF_SERVICE_ROLES: Exclude<Role, "admin">[] = [
  "donor",
  "ngo",
  "volunteer",
]

export interface UserProfile {
  uid: string
  name: string
  email: string
  role: Role
  orgName: string
  phone: string
  createdAt: number
}

export interface FoodDonation {
  id: string
  title: string
  description: string
  quantity: number
  foodType: string
  location: string
  latitude: number | null
  longitude: number | null
  pickupBefore: string
  urgency: Urgency
  status: FoodStatus
  donorName: string
  donorId: string
  donorEmail: string
  image: string

  // NGO that claimed the food (uid). Kept as "rescuedBy" for old data.
  rescuedBy: string | null
  rescuedByName?: string

  // Volunteer who picked it up
  volunteerId?: string | null
  volunteerName?: string

  createdAt?: number
  claimedAt?: number
  pickedUpAt?: number
  completedAt?: number
}

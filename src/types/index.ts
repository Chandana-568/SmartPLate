export type Urgency = "low" | "medium" | "high"

export type FoodStatus =
  | "under_review" // flagged by AI screening, hidden until an admin approves
  | "available"
  | "claimed"
  | "picked-up"
  | "completed"

// What /api/analyze-food returns (mirrors server/analyzeFood.ts)
export interface FoodAnalysis {
  detectedFood: string
  suggestedTitle: string
  suggestedDescription: string
  foodType: "Vegetarian" | "Mixed"
  estimatedServings: number
  safeHours: number
  storageTip: string
  isRealFoodPhoto: boolean
  looksStockOrScreenshot: boolean
  looksSpoiledOrUnsafe: boolean
  textIsSpam: boolean
  concerns: string[]
}

// "recycler" = poultry farm, compost unit or biogas plant: collects expired food
export type Role = "donor" | "ngo" | "volunteer" | "recycler" | "admin"

// Roles a user may pick for themselves at sign-up.
// "admin" is only granted from the Firebase console.
export const SELF_SERVICE_ROLES: Exclude<Role, "admin">[] = [
  "donor",
  "ngo",
  "volunteer",
  "recycler",
]

export type RecyclerType = "poultry" | "compost" | "biogas"

// Expired food collected by a poultry farm, compost unit or biogas plant
export interface Recycle {
  status: "claimed" | "collected"
  byId: string
  byName: string
  type: RecyclerType
  claimedAt: number
  collectedAt?: number
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  role: Role
  orgName: string
  phone: string
  createdAt: number

  // NGO WhatsApp alerts (set from My Rescues)
  whatsappOptIn?: boolean
  latitude?: number | null
  longitude?: number | null

  // Recyclers only
  recyclerType?: RecyclerType
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
  // Same moment in epoch ms, so the security rules can check expiry
  expiresAt?: number
  urgency: Urgency
  status: FoodStatus
  donorName: string
  donorId: string
  donorEmail: string
  image: string

  // NGO that claimed the food (uid). Kept as "rescuedBy" for old data.
  rescuedBy: string | null
  rescuedByName?: string

  // Volunteer who accepted the task / picked it up
  volunteerId?: string | null
  volunteerName?: string

  // Code the volunteer entered at pickup (checked by firestore.rules
  // against donations/{id}/private/otp, which only the donor can read)
  pickupOtp?: string

  // AI screening (Phase 3)
  aiAnalysis?: FoodAnalysis | null
  riskScore?: number
  riskReasons?: string[]
  imageHash?: string | null
  reviewedBy?: string
  reviewedAt?: number

  // After expiry: picked up by a poultry farm, compost unit or biogas plant
  recycle?: Recycle | null

  // true for sample data loaded from the Admin page ("Clear demo data" removes it)
  seed?: boolean

  createdAt?: number
  claimedAt?: number
  assignedAt?: number
  pickedUpAt?: number
  completedAt?: number
}

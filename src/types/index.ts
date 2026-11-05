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

  // Second life (missing on analyses made before Step 3)
  containsMeatFishEgg?: boolean
  animalFeedSafe?: boolean
  secondLifeRoute?: "animal-feed" | "compost"
  secondLifeReason?: string
}

// "partner" = second-life partner: takes expired food for animals or compost
export type Role = "donor" | "ngo" | "volunteer" | "partner" | "admin"

// Roles a user may pick for themselves at sign-up.
// "admin" is only granted from the Firebase console.
export const SELF_SERVICE_ROLES: Exclude<Role, "admin">[] = [
  "donor",
  "ngo",
  "volunteer",
  "partner",
]

// What a second-life partner does with expired food
export type PartnerType = "poultry" | "goshala" | "compost" | "biogas"

// Where expired food ends up
export type SecondLifeRoute = "animal-feed" | "compost" | "biogas"

export interface SecondLife {
  status: "claimed" | "collected"
  partnerId: string
  partnerName: string
  partnerType: PartnerType
  route: SecondLifeRoute
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

  // WhatsApp alerts for NGOs and partners (set on their dashboard)
  whatsappOptIn?: boolean
  latitude?: number | null
  longitude?: number | null

  // Second-life partners only
  partnerType?: PartnerType
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
  // Donor's "safe to eat until", as typed (local time, for display)
  pickupBefore: string
  // Same moment in epoch ms, so security rules can enforce expiry
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

  // After expiry: taken by a poultry farm, goshala, compost or biogas partner
  secondLife?: SecondLife | null

  // true for sample data loaded from the Admin page ("Clear demo data" removes it)
  seed?: boolean

  createdAt?: number
  claimedAt?: number
  assignedAt?: number
  pickedUpAt?: number
  completedAt?: number
}

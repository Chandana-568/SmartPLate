export type Urgency = "low" | "medium" | "high"

export type FoodStatus =
  | "available"
  | "claimed"
  | "picked-up"
  | "completed"

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
rescuedBy: string | null
}
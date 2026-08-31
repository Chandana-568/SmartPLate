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
  latitude: number
  longitude: number
  pickupBefore: string
  urgency: Urgency
  status: FoodStatus
  donorName: string
  image: string
}
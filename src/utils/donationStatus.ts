import type { FoodDonation } from "../types"

// The delivery stages shown in the timeline. "assigned" is not stored as a
// status: it means status "claimed" + a volunteer has accepted the task.
export type DeliveryStage =
  | "posted"
  | "claimed"
  | "assigned"
  | "picked-up"
  | "completed"

export function deliveryStage(donation: FoodDonation): DeliveryStage {
  if (donation.status === "completed") return "completed"
  if (donation.status === "picked-up") return "picked-up"
  if (donation.status === "claimed") {
    return donation.volunteerId ? "assigned" : "claimed"
  }
  return "posted"
}

// Unclaimed food whose pickup deadline has passed is no longer safe to offer.
export function isExpired(donation: FoodDonation, now = Date.now()) {
  if (donation.status !== "available") return false
  // Same moment the security rules check (expiresAt), when present
  const deadline =
    typeof donation.expiresAt === "number"
      ? donation.expiresAt
      : new Date(donation.pickupBefore).getTime()
  return Number.isFinite(deadline) && deadline < now
}

export function isOpenForClaim(donation: FoodDonation, now = Date.now()) {
  return donation.status === "available" && !isExpired(donation, now)
}

export function formatTime(value?: number | string | null) {
  if (value == null || value === "") return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

// Random 4-digit code the donor shows the volunteer at pickup
export function generatePickupCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000
  return n.toString().padStart(4, "0")
}

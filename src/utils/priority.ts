import type { FoodDonation } from "../types"
import { getFreshness } from "./freshness"

// Dynamic collection priority (the problem statement's "bins that fill
// faster than expected"): recalculated on every tick, so a sudden big,
// fast-expiring donation jumps to the top instead of waiting for a schedule.
//
//   urgency  up to 60 pts: less safe time left = more points
//   size     up to 25 pts: more meals = more points (log scale)
//   distance up to 15 pts: closer = more points (when known)

export type PriorityTier = "critical" | "high" | "normal"

export interface Priority {
  score: number // 0-100
  tier: PriorityTier
}

const HOUR = 60 * 60 * 1000

export function priorityOf(
  donation: Pick<FoodDonation, "pickupBefore" | "createdAt" | "quantity">,
  now = Date.now(),
  distanceKm?: number | null
): Priority {
  const fresh = getFreshness(donation, now)
  const hoursLeft = fresh ? Math.max(0, fresh.msLeft / HOUR) : 6

  // 60 pts at 0 h left, ~0 pts at 8 h+ left
  const urgency = 60 * Math.max(0, 1 - hoursLeft / 8)
  // 25 pts at ~200 meals
  const size = 25 * Math.min(1, Math.log10(1 + Math.max(0, donation.quantity)) / Math.log10(201))
  // 15 pts on the doorstep, 0 at 15 km+
  const distance = distanceKm == null ? 7.5 : 15 * Math.max(0, 1 - distanceKm / 15)

  const score = Math.round(urgency + size + distance)
  const tier: PriorityTier =
    fresh?.stage === "urgent" || score >= 70 ? "critical" : fresh?.stage === "soon" || score >= 45 ? "high" : "normal"
  return { score, tier }
}

export const TIER_LABEL: Record<PriorityTier, string> = {
  critical: "🔥 Critical",
  high: "⚡ High",
  normal: "Normal",
}

export const TIER_STYLE: Record<PriorityTier, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-yellow-100 text-yellow-800",
  normal: "bg-gray-100 text-gray-600",
}

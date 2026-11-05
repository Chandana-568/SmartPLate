import type { FoodDonation } from "../types"

// The donor-set "safe until" time is stored in `pickupBefore`.
// Freshness = share of the safe window still left, from posting to expiry.

export type FreshnessStage = "fresh" | "soon" | "urgent" | "expired"

export interface Freshness {
  stage: FreshnessStage
  percentLeft: number // 0-100
  msLeft: number
  label: string // "Fresh", "Use soon", ...
  timeLeft: string // "2 h 15 min left" / "Expired 40 min ago"
}

const DEFAULT_WINDOW_MS = 6 * 60 * 60 * 1000 // for old listings without createdAt

export const STAGE_LABEL: Record<FreshnessStage, string> = {
  fresh: "Fresh",
  soon: "Use soon",
  urgent: "Urgent",
  expired: "Expired",
}

// Prefer the exact epoch time (what the security rules check); fall back to
// the typed local time for listings made before expiresAt existed.
export function expiresAt(donation: Pick<FoodDonation, "pickupBefore" | "expiresAt">): number {
  return typeof donation.expiresAt === "number"
    ? donation.expiresAt
    : new Date(donation.pickupBefore).getTime()
}

export function formatDuration(ms: number) {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  const minutes = totalMin % 60
  if (days > 0) return `${days} d ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}

export function getFreshness(
  donation: Pick<FoodDonation, "pickupBefore" | "createdAt" | "expiresAt">,
  now = Date.now()
): Freshness | null {
  const end = expiresAt(donation)
  if (!Number.isFinite(end)) return null

  const start = donation.createdAt && donation.createdAt < end ? donation.createdAt : end - DEFAULT_WINDOW_MS
  const msLeft = end - now
  const percentLeft = Math.max(0, Math.min(100, (msLeft / (end - start)) * 100))

  const stage: FreshnessStage =
    msLeft <= 0 ? "expired" : percentLeft > 50 ? "fresh" : percentLeft > 25 ? "soon" : "urgent"

  return {
    stage,
    percentLeft,
    msLeft,
    label: STAGE_LABEL[stage],
    timeLeft: msLeft > 0 ? `${formatDuration(msLeft)} left` : `Expired ${formatDuration(-msLeft)} ago`,
  }
}

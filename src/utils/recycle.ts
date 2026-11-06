import type { FoodDonation, RecyclerType } from "../types"

// Expired food: never for people again, collected by a poultry farm,
// compost unit or biogas plant instead of going to the bin.

export const RECYCLER_TYPES: Record<RecyclerType, { label: string; emoji: string; use: string }> = {
  poultry: { label: "Poultry farm", emoji: "🐔", use: "poultry feed" },
  compost: { label: "Compost unit", emoji: "🌱", use: "compost" },
  biogas: { label: "Biogas plant", emoji: "⚡", use: "biogas" },
}

export const KG_PER_SERVING = 0.4

export function expiryMs(d: Pick<FoodDonation, "expiresAt" | "pickupBefore">) {
  return typeof d.expiresAt === "number" ? d.expiresAt : new Date(d.pickupBefore).getTime()
}

// Past its pickup time and never picked up for people: unclaimed, or
// claimed by an NGO that didn't collect it in time.
export function isExpiredForPeople(d: FoodDonation, now = Date.now()) {
  const expiry = expiryMs(d)
  return (d.status === "available" || d.status === "claimed") && Number.isFinite(expiry) && now > expiry
}

// Can this kind of recycler take it? Poultry feed is stricter.
export function suitableFor(d: FoodDonation, type: RecyclerType): { ok: true } | { ok: false; reason: string } {
  if (type !== "poultry") return { ok: true }
  if (d.foodType !== "Vegetarian") return { ok: false, reason: "Contains non-veg: compost or biogas only" }
  if (d.aiAnalysis?.looksSpoiledOrUnsafe) return { ok: false, reason: "Looks spoiled: compost or biogas only" }
  return { ok: true }
}

// Recyclers can only claim listings that carry the exact expiry (the
// security rules need it). Older listings are view-only.
export function claimableByRecycler(d: FoodDonation) {
  return typeof d.expiresAt === "number"
}

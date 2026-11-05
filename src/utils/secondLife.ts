// Second life for expired food, following the food recovery hierarchy:
// people → animals → compost / biogas → never landfill.
//
// Shared by the app and the server (WhatsApp alerts), so it has no imports.
// These are conservative demo rules; real partners make the final call and
// production would follow FSSAI and veterinary guidance.

export type PartnerTypeId = "poultry" | "goshala" | "compost" | "biogas"
export type RouteId = "animal-feed" | "compost" | "biogas"

export const PARTNER_TYPES: Record<PartnerTypeId, { label: string; emoji: string; route: RouteId }> = {
  poultry: { label: "Poultry farm", emoji: "🐔", route: "animal-feed" },
  goshala: { label: "Goshala / cattle shelter", emoji: "🐄", route: "animal-feed" },
  compost: { label: "Compost unit", emoji: "🌱", route: "compost" },
  biogas: { label: "Biogas plant", emoji: "⚡", route: "biogas" },
}

export const ROUTE_LABEL: Record<RouteId, string> = {
  "animal-feed": "Animal feed",
  compost: "Compost",
  biogas: "Biogas",
}

const HOUR = 60 * 60 * 1000
export const ANIMAL_FEED_MAX_AGE_MS = 24 * HOUR // after expiry
export const RECYCLE_MAX_AGE_MS = 7 * 24 * HOUR // after expiry
export const KG_PER_SERVING = 0.4

interface ExpiredFood {
  foodType: string
  expiresAt?: number
  pickupBefore: string
  aiAnalysis?: {
    looksSpoiledOrUnsafe?: boolean
    containsMeatFishEgg?: boolean
    animalFeedSafe?: boolean
    secondLifeReason?: string
  } | null
}

export function expiryMs(food: Pick<ExpiredFood, "expiresAt" | "pickupBefore">) {
  return typeof food.expiresAt === "number" ? food.expiresAt : new Date(food.pickupBefore).getTime()
}

// Can this partner type safely take this food? Returns the reason if not.
export function suitability(
  food: ExpiredFood,
  partnerType: PartnerTypeId,
  now = Date.now()
): { ok: true; route: RouteId } | { ok: false; reason: string } {
  const sinceExpiry = now - expiryMs(food)
  if (!(sinceExpiry > 0)) return { ok: false, reason: "Still safe for people" }
  if (sinceExpiry > RECYCLE_MAX_AGE_MS) return { ok: false, reason: "Too old to collect" }

  const type = PARTNER_TYPES[partnerType]
  if (type.route !== "animal-feed") return { ok: true, route: type.route }

  // Animal feed is stricter. The AI can only make it stricter, never looser.
  const animal = animalFeedCheck(food)
  if (!animal.ok) return animal
  if (sinceExpiry > ANIMAL_FEED_MAX_AGE_MS) return { ok: false, reason: "Expired over 24 h ago: compost only" }
  return { ok: true, route: "animal-feed" }
}

// Is this food OK for animals at all (ignoring how long ago it expired)?
function animalFeedCheck(food: ExpiredFood): { ok: true } | { ok: false; reason: string } {
  const ai = food.aiAnalysis
  if (food.foodType !== "Vegetarian") return { ok: false, reason: "Contains non-veg: compost only" }
  if (ai?.containsMeatFishEgg) return { ok: false, reason: "AI spotted meat, fish or egg: compost only" }
  if (ai?.looksSpoiledOrUnsafe) return { ok: false, reason: "AI: looks spoiled: compost only" }
  if (ai?.animalFeedSafe === false) {
    return { ok: false, reason: `AI: ${ai.secondLifeReason || "not suitable for animals"}` }
  }
  return { ok: true }
}

// Advice shown to donors and partners before or after expiry
export function secondLifeAdvice(food: ExpiredFood): { route: RouteId; reason: string; byAi: boolean } {
  const check = animalFeedCheck(food)
  const byAi = Boolean(food.aiAnalysis && "animalFeedSafe" in food.aiAnalysis)
  if (!check.ok) return { route: "compost", reason: check.reason, byAi }
  return {
    route: "animal-feed",
    reason: food.aiAnalysis?.secondLifeReason || "Vegetarian and not spoiled: fine for animal feed",
    byAi,
  }
}

// The best route for this food (animal feed when safe, otherwise compost)
export function bestRoute(food: ExpiredFood, now = Date.now()): RouteId | null {
  if (suitability(food, "goshala", now).ok) return "animal-feed"
  if (suitability(food, "compost", now).ok) return "compost"
  return null
}

// Second life for expired food: a simulated demo.
//
// When food passes its safe time before anyone picks it up, it is never
// offered to people again. Instead it is automatically routed, following
// the food recovery hierarchy (people → animals → compost, never landfill),
// to the nearest suitable place from a small DEMO list near Mysuru.
// In production these would be real partners notified on WhatsApp.
//
// Pure functions with no imports, so the UI can use them anywhere.

export type RouteId = "animal-feed" | "compost"
export type SecondLifeStage = "routed" | "collecting" | "received"

export const ROUTE_LABEL: Record<RouteId, string> = {
  "animal-feed": "Animal feed",
  compost: "Compost",
}

export const KG_PER_SERVING = 0.4
const MIN = 60 * 1000
const HOUR = 60 * MIN

// Simulated partner network (fictional names, Mysuru locations)
export const DEMO_PLACES: { name: string; kind: "poultry" | "goshala" | "compost"; emoji: string; lat: number; lng: number }[] = [
  { name: "Sri Lakshmi Poultry Farm", kind: "poultry", emoji: "🐔", lat: 12.3712, lng: 76.6021 },
  { name: "Chamundi Poultry Farm", kind: "poultry", emoji: "🐔", lat: 12.2731, lng: 76.6705 },
  { name: "Nandi Goshala", kind: "goshala", emoji: "🐄", lat: 12.3205, lng: 76.6918 },
  { name: "Green Earth Compost Unit", kind: "compost", emoji: "🌱", lat: 12.3478, lng: 76.6512 },
  { name: "Mysuru City Compost Yard", kind: "compost", emoji: "🌱", lat: 12.2905, lng: 76.6187 },
]

interface Food {
  status: string
  foodType: string
  quantity: number
  pickupBefore: string
  expiresAt?: number
  latitude?: number | null
  longitude?: number | null
  aiAnalysis?: {
    looksSpoiledOrUnsafe?: boolean
    containsMeatFishEgg?: boolean
    animalFeedSafe?: boolean
    secondLifeReason?: string
  } | null
}

export function expiryMs(food: Pick<Food, "expiresAt" | "pickupBefore">) {
  return typeof food.expiresAt === "number" ? food.expiresAt : new Date(food.pickupBefore).getTime()
}

// Expired before anyone picked it up (unclaimed, or claimed by an NGO too late)
export function expiredBeforePickup(food: Pick<Food, "status" | "expiresAt" | "pickupBefore">, now = Date.now()) {
  const expiry = expiryMs(food)
  return (food.status === "available" || food.status === "claimed") && Number.isFinite(expiry) && now > expiry
}

// Animal feed or compost, with the reason (the AI's photo check decides when available)
export function secondLifeAdvice(food: Food): { route: RouteId; reason: string } {
  const ai = food.aiAnalysis
  if (food.foodType !== "Vegetarian") return { route: "compost", reason: "Contains non-veg: compost only" }
  if (ai?.containsMeatFishEgg) return { route: "compost", reason: "AI spotted meat, fish or egg: compost only" }
  if (ai?.looksSpoiledOrUnsafe) return { route: "compost", reason: "AI: looks spoiled, compost only" }
  if (ai?.animalFeedSafe === false) return { route: "compost", reason: `AI: ${ai.secondLifeReason || "not suitable for animals"}` }
  return { route: "animal-feed", reason: ai?.secondLifeReason || "Vegetarian and not spoiled: fine for animal feed" }
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (d: number) => (d * Math.PI) / 180
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface SimulatedSecondLife {
  route: RouteId
  reason: string
  place: (typeof DEMO_PLACES)[number]
  km: number | null
  kg: number
  stage: SecondLifeStage
  expiredAt: number
  routedAt: number
  collectingAt: number
  receivedAt: number
}

// The simulated journey after expiry: routed at once, collection after
// 20 min, received after 1 h. The demo time machine plays it on stage.
export function simulateSecondLife(food: Food, now = Date.now()): SimulatedSecondLife | null {
  if (!expiredBeforePickup(food, now)) return null

  // Animal feed only within 24 h of expiry; after that, compost
  const expiredAt = expiryMs(food)
  let { route, reason } = secondLifeAdvice(food)
  if (route === "animal-feed" && now - expiredAt > 24 * HOUR) {
    route = "compost"
    reason = "Expired over 24 h ago: compost only"
  }

  const candidates = DEMO_PLACES.filter((p) => (route === "animal-feed" ? p.kind !== "compost" : p.kind === "compost"))
  const located = food.latitude != null && food.longitude != null
  const ranked = candidates
    .map((place) => ({ place, km: located ? distanceKm(food.latitude!, food.longitude!, place.lat, place.lng) : null }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0))
  const { place, km } = ranked[0]

  const routedAt = expiredAt
  const collectingAt = expiredAt + 20 * MIN
  const receivedAt = expiredAt + 60 * MIN
  const stage: SecondLifeStage = now >= receivedAt ? "received" : now >= collectingAt ? "collecting" : "routed"

  return {
    route,
    reason,
    place,
    km,
    kg: Math.round((Number(food.quantity) || 0) * KG_PER_SERVING),
    stage,
    expiredAt,
    routedAt,
    collectingAt,
    receivedAt,
  }
}

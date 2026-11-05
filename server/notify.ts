// POST /api/notify { event, donationId }
// Sends WhatsApp updates to NGOs. The client only says *what happened*; the
// server re-reads the donation, checks the event really matches its current
// state, picks the recipients and writes the message itself. So nobody can
// use this endpoint to send arbitrary text or spam old events.
import { allowRequest, verifyFirebaseUser } from "./auth.ts"
import { getDocument, queryEquals } from "./firestoreRest.ts"
import { maskPhone, normalizeIndianPhone, sendWhatsApp, whatsappConfigured, type SendResult } from "./whatsapp.ts"
import {
  KG_PER_SERVING,
  PARTNER_TYPES,
  ROUTE_LABEL,
  awaitingSecondLife,
  suitability,
  type PartnerTypeId,
} from "../src/utils/secondLife.ts"

type Env = Record<string, string | undefined>

export const EVENTS = ["posted", "claimed", "assigned", "picked-up", "completed", "expired"] as const
export type NotifyEvent = (typeof EVENTS)[number]

interface Donation {
  title: string
  quantity: number
  foodType: string
  location: string
  latitude: number | null
  longitude: number | null
  pickupBefore: string
  expiresAt?: number
  secondLife?: unknown
  aiAnalysis?: { looksSpoiledOrUnsafe?: boolean } | null
  status: string
  donorName: string
  rescuedBy?: string | null
  rescuedByName?: string
  volunteerId?: string | null
  volunteerName?: string
  createdAt?: number
  claimedAt?: number
  assignedAt?: number
  pickedUpAt?: number
  completedAt?: number
  reviewedAt?: number
}

interface NgoProfile {
  role: string
  name: string
  orgName?: string
  phone?: string
  whatsappOptIn?: boolean
  latitude?: number | null
  longitude?: number | null
  partnerType?: PartnerTypeId
}

const FRESH_MS = 15 * 60 * 1000 // events older than this are ignored
const EXPIRED_ALERT_WINDOW_MS = 2 * 60 * 60 * 1000 // alert partners within 2 h of expiry
const PARTNER_RADIUS_KM = 25
const NEARBY_KM = 15
const MAX_NEARBY_NGOS = 5

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } })

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (d: number) => (d * Math.PI) / 180
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// "2026-11-05T19:29" (donor's local time) → "5 Nov, 7:29 pm" without timezone shifts
function formatPickup(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!m) return value
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const hour = Number(m[4])
  const h12 = hour % 12 || 12
  return `${Number(m[3])} ${months[Number(m[2]) - 1]}, ${h12}:${m[5]} ${hour < 12 ? "am" : "pm"}`
}

// The event must match the donation's real, current state, and be recent
function eventIsGenuine(event: NotifyEvent, d: Donation, now: number) {
  const recent = (t?: number) => typeof t === "number" && now - t < FRESH_MS
  switch (event) {
    case "posted":
      // Fresh post, or a flagged post an admin has just approved
      return d.status === "available" && (recent(d.createdAt) || recent(d.reviewedAt))
    case "claimed":
      return d.status === "claimed" && recent(d.claimedAt)
    case "assigned":
      return d.status === "claimed" && Boolean(d.volunteerId) && recent(d.assignedAt)
    case "picked-up":
      return d.status === "picked-up" && recent(d.pickedUpAt)
    case "completed":
      return d.status === "completed" && recent(d.completedAt)
    case "expired":
      // Really past its expiry, never picked up, no partner yet, and recent
      return awaitingSecondLife(d, now) && now - (d.expiresAt as number) < EXPIRED_ALERT_WINDOW_MS
  }
}

// Message for second-life partners when food near them expires
export function buildExpiredMessage(d: Donation, partnerType: PartnerTypeId, link: string, km?: number) {
  const type = PARTNER_TYPES[partnerType]
  return [
    "♻️ *Expired food near you: keep it out of a landfill* (SharePlate)",
    `about ${Math.round(d.quantity * KG_PER_SERVING)} kg · ${d.title}`,
    `${type.emoji} Suitable for: ${ROUTE_LABEL[type.route]}`,
    `📍 ${d.location}${km != null ? ` (${km.toFixed(1)} km away)` : ""}`,
    `⏰ Was safe for people until ${formatPickup(d.pickupBefore)}`,
    `From: ${d.donorName}`,
    "",
    `Collect it: ${link}`,
  ].join("\n")
}

export function buildMessage(event: NotifyEvent, d: Donation, link: string, km?: number) {
  const food = `${d.quantity} servings · ${d.title}`
  switch (event) {
    case "posted":
      return [
        "🍱 *New surplus food near you* (SharePlate)",
        food,
        `${d.foodType === "Vegetarian" ? "🟢 Vegetarian" : "🟤 Contains non-veg"}`,
        `📍 ${d.location}${km != null ? ` (${km.toFixed(1)} km away)` : ""}`,
        `⏰ Pickup before ${formatPickup(d.pickupBefore)}`,
        `From: ${d.donorName}`,
        "",
        `Claim it before someone else does: ${link}`,
      ].join("\n")
    case "claimed":
      return [
        "✅ *You claimed food on SharePlate*",
        food,
        `📍 Pickup: ${d.location} (${d.donorName})`,
        "We're finding a volunteer to deliver it. We'll message you at every step.",
        `Track: ${link}`,
      ].join("\n")
    case "assigned":
      return [
        `🚴 *${d.volunteerName ?? "A volunteer"} accepted your delivery*`,
        food,
        `They're heading to ${d.donorName} in ${d.location}.`,
        `Track: ${link}`,
      ].join("\n")
    case "picked-up":
      return [
        "📦 *Food picked up, on the way to you*",
        food,
        `${d.volunteerName ?? "Your volunteer"} collected it from ${d.donorName} (pickup code verified).`,
        `Track: ${link}`,
      ].join("\n")
    case "completed":
      return [
        "🎉 *Delivery complete, thank you!*",
        `${d.quantity} meals received from ${d.donorName}.`,
        `That's about ${Math.round(d.quantity * 0.4)} kg of food saved from waste.`,
        `Details: ${link}`,
      ].join("\n")
    case "expired":
      return buildExpiredMessage(d, "compost", link, km)
  }
}

// Keeps the first (nearest) entry per phone number
function uniqueByPhone<T extends { phone: string }>(list: T[]): T[] {
  const seen = new Set<string>()
  return list.filter((item) => !seen.has(item.phone) && Boolean(seen.add(item.phone)))
}

// Remembers recent sends so double-clicks don't double-message
const sentRecently = new Map<string, number>()
function alreadySent(key: string, now: number) {
  for (const [k, t] of sentRecently) if (now - t > FRESH_MS) sentRecently.delete(k)
  if (sentRecently.has(key)) return true
  sentRecently.set(key, now)
  return false
}

export async function handleNotifyRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json(405, { error: "Use POST." })
  if (!whatsappConfigured(env)) return json(503, { error: "WhatsApp is not configured." })

  const header = request.headers.get("authorization") ?? ""
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : ""
  let uid: string
  try {
    uid = await verifyFirebaseUser(request, env)
  } catch (error) {
    return json(401, { error: error instanceof Error ? error.message : "Please log in." })
  }

  const body = (await request.json().catch(() => ({}))) as { event?: string; donationId?: string }

  // "Send test message" from the NGO's settings card: only ever goes to the
  // caller's own saved number, and shows Twilio's answer so setup is easy.
  if (body.event === "test") {
    if (!allowRequest(uid)) return json(429, { error: "Too many tests. Wait a while." })
    const me = await getDocument<NgoProfile>(env, idToken, `users/${uid}`)
    const phone = me?.phone ? normalizeIndianPhone(me.phone) : null
    if (!phone) return json(400, { error: "Save a valid WhatsApp number first." })
    const result = await sendWhatsApp(
      env,
      phone,
      `✅ SharePlate WhatsApp alerts are working for ${me?.orgName || me?.name || "you"}.\nYou'll get new food near you and live delivery updates here.`
    )
    return json(result.ok ? 200 : 502, result.ok ? { sent: 1, to: maskPhone(phone) } : { error: result.error, to: maskPhone(phone) })
  }

  const event = body.event as NotifyEvent
  if (!EVENTS.includes(event) || typeof body.donationId !== "string" || !/^[A-Za-z0-9]{1,64}$/.test(body.donationId)) {
    return json(400, { error: "Invalid event or donationId." })
  }

  const now = Date.now()
  const donation = await getDocument<Donation>(env, idToken, `donations/${body.donationId}`)
  if (!donation) return json(404, { error: "Donation not found." })
  if (!eventIsGenuine(event, donation, now)) return json(409, { error: "Event doesn't match the donation's current state." })
  if (alreadySent(`${donation.id}:${event}`, now)) return json(200, { sent: 0, skipped: "duplicate" })

  const site = (env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "")
  const link = `${site}/food/${donation.id}`

  // ---- Expired food → nearest suitable second-life partners ----
  if (event === "expired") {
    const partners = await queryEquals<NgoProfile>(env, idToken, "users", "role", "partner")
    const { latitude: lat, longitude: lng } = donation
    const suitable = partners
      .map((p) => ({ ...p, phone: p.whatsappOptIn && p.phone ? normalizeIndianPhone(p.phone) : null }))
      .filter((p): p is typeof p & { phone: string; partnerType: PartnerTypeId } =>
        Boolean(p.phone && p.partnerType && suitability(donation, p.partnerType, now).ok))
      .map((p) => ({
        ...p,
        km: lat != null && lng != null && p.latitude != null && p.longitude != null
          ? distanceKm(lat, lng, p.latitude, p.longitude)
          : undefined,
      }))
    const located = suitable.filter((p) => p.km != null && p.km <= PARTNER_RADIUS_KM).sort((a, b) => a.km! - b.km!)
    // De-duplicate phones BEFORE taking the nearest few, so one phone shared
    // by several accounts can't crowd out other partners
    const unique = uniqueByPhone(located.length ? located : suitable.filter((p) => p.km == null)).slice(0, MAX_NEARBY_NGOS)
    if (unique.length === 0) return json(200, { sent: 0, skipped: "no opted-in partner to notify" })

    const partnerLink = `${site}/second-life`
    const results = await Promise.all(
      unique.map(async (p) => {
        const message = buildExpiredMessage(donation, p.partnerType, partnerLink, p.km)
        const result = await sendWhatsApp(env, p.phone, message)
        return env.WHATSAPP_DRY_RUN === "true" ? { ...result, message } : result
      })
    )
    return json(200, { sent: results.filter((r) => r.ok).length, results })
  }

  // ---- Recipients ----
  const ngos = await queryEquals<NgoProfile>(env, idToken, "users", "role", "ngo")
  const reachable = ngos
    .map((ngo) => ({ ...ngo, phone: ngo.whatsappOptIn && ngo.phone ? normalizeIndianPhone(ngo.phone) : null }))
    .filter((ngo): ngo is typeof ngo & { phone: string } => Boolean(ngo.phone))

  let recipients: { phone: string; km?: number }[] = []
  if (event === "posted") {
    const { latitude: lat, longitude: lng } = donation
    const located = reachable
      .filter((n) => lat != null && lng != null && n.latitude != null && n.longitude != null)
      .map((n) => ({ phone: n.phone, km: distanceKm(lat!, lng!, n.latitude!, n.longitude!) }))
      .filter((n) => n.km <= NEARBY_KM)
      .sort((a, b) => a.km - b.km)
    // Nobody has shared a location yet: fall back to a few opted-in NGOs.
    // De-duplicate phones first (demo accounts often share one), then take the nearest.
    recipients = uniqueByPhone(located.length ? located : reachable.map((n) => ({ phone: n.phone })))
    recipients = recipients.slice(0, MAX_NEARBY_NGOS)
  } else {
    const ngo = reachable.find((n) => n.id === donation.rescuedBy)
    if (ngo) recipients = [{ phone: ngo.phone }]
  }

  if (recipients.length === 0) return json(200, { sent: 0, skipped: "no opted-in NGO to notify" })

  const results: (SendResult & { message?: string })[] = await Promise.all(
    recipients.map(async ({ phone, km }) => {
      const message = buildMessage(event, donation, link, km)
      const result = await sendWhatsApp(env, phone, message)
      return env.WHATSAPP_DRY_RUN === "true" ? { ...result, message } : result
    })
  )

  return json(200, { sent: results.filter((r) => r.ok).length, results })
}

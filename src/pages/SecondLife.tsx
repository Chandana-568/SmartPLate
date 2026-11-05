import { CheckCircle2, MapPin, Navigation, Recycle, Scale, Sparkles } from "lucide-react"
import { useState } from "react"

import WhatsAppSettings from "../components/WhatsAppSettings"
import { useAuth } from "../context/auth"
import { useNow } from "../hooks/useNow"
import { claimSecondLife, markSecondLifeCollected } from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"
import type { FoodDonation, PartnerType } from "../types"
import { calculateDistance } from "../utils/distance"
import { formatDuration } from "../utils/freshness"
import {
  expiryMs,
  KG_PER_SERVING,
  PARTNER_TYPES,
  awaitingSecondLife,
  ROUTE_LABEL,
  secondLifeAdvice,
  suitability,
} from "../utils/secondLife"

// Dashboard for poultry farms, goshalas, compost units and biogas plants:
// expired food that must not reach people, but must not reach landfill either.
function SecondLife() {
  const { user, profile } = useAuth()
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)
  const now = useNow()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")

  if (!user || !profile) return null

  const partnerType: PartnerType = profile.partnerType ?? "compost"
  const type = PARTNER_TYPES[partnerType]
  const lat = profile.latitude ?? null
  const lng = profile.longitude ?? null

  const distanceTo = (d: FoodDonation) =>
    lat != null && lng != null && d.latitude != null && d.longitude != null
      ? calculateDistance(lat, lng, d.latitude, d.longitude)
      : null

  // Every expired listing nobody collected (including food an NGO claimed
  // too late), split into what this partner may take and what it may not
  const expired = donations
    .filter((d) => awaitingSecondLife(d, now))
    .map((d) => ({ donation: d, fit: suitability(d, partnerType, now), km: distanceTo(d) }))
    .sort((a, b) => (a.km ?? 9999) - (b.km ?? 9999) || expiryMs(b.donation) - expiryMs(a.donation))

  const open = expired.filter((item) => item.fit.ok)
  const notForYou = expired.filter(
    (item): item is typeof item & { fit: { ok: false; reason: string } } =>
      !item.fit.ok && item.fit.reason !== "Too old to collect"
  )

  const mine = donations
    .filter((d) => d.secondLife?.partnerId === user.uid)
    .sort((a, b) => (b.secondLife?.claimedAt ?? 0) - (a.secondLife?.claimedAt ?? 0))

  const collectedKg = mine
    .filter((d) => d.secondLife?.status === "collected")
    .reduce((sum, d) => sum + d.quantity * KG_PER_SERVING, 0)

  const run = async (id: string, action: () => Promise<void>) => {
    try {
      setBusyId(id)
      setError("")
      await action()
    } catch (err) {
      console.error("Second-life action failed:", err)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  const card = (d: FoodDonation, km: number | null, action: React.ReactNode) => {
    const kg = Math.round(d.quantity * KG_PER_SERVING)
    const directions =
      d.latitude != null && d.longitude != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.location)}`
    const route = d.secondLife?.route ?? type.route

    return (
      <div key={d.id} className="overflow-hidden rounded-3xl border bg-white">
        <div className="relative">
          <img src={d.image} alt={d.title} className="h-40 w-full object-cover grayscale-[40%]" />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow">
            {route === "animal-feed" ? "🐾" : route === "biogas" ? "⚡" : "🌱"} {ROUTE_LABEL[route]}
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-semibold text-white">
            Expired {formatDuration(now - expiryMs(d))} ago
          </span>
        </div>
        <div className="p-5">
          <h3 className="font-bold">{d.title}</h3>
          <div className="mt-3 space-y-1.5 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <Scale className="h-4 w-4" /> about {kg} kg · {d.foodType}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {d.location} ({d.donorName})
              {km != null && <span className="font-semibold text-gray-800">· {km.toFixed(1)} km</span>}
            </p>
          </div>
          {/* Why this route: from the AI's photo check when available */}
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {secondLifeAdvice(d).reason}
          </p>
          {action}
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50"
          >
            <Navigation className="h-4 w-4" /> Directions
          </a>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
            <Recycle className="h-4 w-4" /> Second life
          </p>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            {type.emoji} {profile.orgName || type.label}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Food that's past its safe time for people, but too good for a landfill.
            {type.route === "animal-feed"
              ? " You only see vegetarian food that expired less than 24 hours ago and doesn't look spoiled."
              : " You see all expired food from the last 7 days."}
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-3 text-green-800">
            <span className="text-2xl font-bold tabular-nums">{Math.round(collectedKg)} kg</span>
            <span className="text-sm">kept out of landfill by you</span>
          </div>

          <WhatsAppSettings profile={profile} />
          {lat == null && (
            <p className="mt-3 text-sm text-gray-500">
              Tip: add your location in the WhatsApp card to see the nearest food first.
            </p>
          )}
          {error && (
            <p className="mt-4 max-w-2xl rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            <h2 className="text-2xl font-bold">
              Available near you <span className="text-base font-medium text-gray-400">({open.length})</span>
            </h2>
            {open.length === 0 ? (
              <p className="mt-4 rounded-3xl border bg-white px-6 py-12 text-center text-gray-500">
                Nothing expired right now. Good news: that means people got the food first.
              </p>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {open.map(({ donation, km }) =>
                  card(
                    donation,
                    km,
                    <button
                      type="button"
                      disabled={busyId === donation.id}
                      onClick={() =>
                        run(donation.id, () =>
                          claimSecondLife(donation.id, { ...profile, partnerType }, type.route)
                        )
                      }
                      className="mt-4 w-full rounded-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      {busyId === donation.id ? "Claiming..." : `Collect for ${ROUTE_LABEL[type.route].toLowerCase()}`}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Nothing is silently hidden: show what's expired but not for this partner, and why */}
            {notForYou.length > 0 && (
              <details className="mt-8 rounded-3xl border bg-white p-5">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700">
                  Not suitable for your {type.label.toLowerCase()} ({notForYou.length}): other partners will collect these
                </summary>
                <ul className="mt-4 divide-y text-sm">
                  {notForYou.map(({ donation, fit, km }) => (
                    <li key={donation.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <span>
                        <span className="font-semibold">{donation.title}</span>
                        <span className="text-gray-500">
                          {" "}· {donation.location}
                          {km != null && ` · ${km.toFixed(1)} km`}
                        </span>
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{fit.reason}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {mine.length > 0 && (
              <>
                <h2 className="mt-14 text-2xl font-bold">
                  Your collections <span className="text-base font-medium text-gray-400">({mine.length})</span>
                </h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {mine.map((d) =>
                    card(
                      d,
                      distanceTo(d),
                      d.secondLife?.status === "collected" ? (
                        <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-green-50 px-5 py-3 font-semibold text-green-700">
                          <CheckCircle2 className="h-4 w-4" /> Collected
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === d.id}
                          onClick={() => run(d.id, () => markSecondLifeCollected(d))}
                          className="mt-4 w-full rounded-full bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {busyId === d.id ? "Saving..." : "Mark collected"}
                        </button>
                      )
                    )
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default SecondLife

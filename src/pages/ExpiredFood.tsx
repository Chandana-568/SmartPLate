import { CheckCircle2, Lock, MapPin, Navigation, Recycle, Scale, TimerOff, User } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import DonorContact from "../components/DonorContact"
import { useAuth } from "../context/auth"
import { useNow } from "../hooks/useNow"
import { claimForRecycling, markRecycled } from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"
import type { FoodDonation, RecyclerType } from "../types"
import { calculateDistance } from "../utils/distance"
import {
  claimableByRecycler,
  expiryMs,
  isExpiredForPeople,
  KG_PER_SERVING,
  RECYCLER_TYPES,
  suitableFor,
} from "../utils/recycle"

function ago(ms: number) {
  const min = Math.max(1, Math.round(ms / 60000))
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  return h < 24 ? `${h} h ${min % 60} min ago` : `${Math.floor(h / 24)} d ago`
}

// Expired food: no longer for people. Only poultry farms, compost units and
// biogas plants see the pickup details and can collect it.
function ExpiredFood() {
  const { user, profile, role } = useAuth()
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)
  const now = useNow()

  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null)

  const isRecycler = role === "recycler"
  const isAdmin = role === "admin"
  const canSeeDetails = isRecycler || isAdmin
  const myType: RecyclerType = profile?.recyclerType ?? "compost"
  const uid = user?.uid

  const distanceTo = (d: FoodDonation) =>
    here && d.latitude != null && d.longitude != null
      ? calculateDistance(here.lat, here.lng, d.latitude, d.longitude)
      : null

  // Expired for people and not yet collected by anyone
  const expired = donations
    .filter((d) => isExpiredForPeople(d, now) && d.recycle?.status !== "collected")
    .sort((a, b) => (distanceTo(a) ?? 0) - (distanceTo(b) ?? 0) || expiryMs(b) - expiryMs(a))

  const mine = isRecycler && uid ? donations.filter((d) => d.recycle?.byId === uid) : []
  // Listings that aren't in "Your pickups" (careful: logged out, uid is undefined)
  const others = expired.filter((d) => !uid || d.recycle?.byId !== uid)
  const collectedKg = mine
    .filter((d) => d.recycle?.status === "collected")
    .reduce((sum, d) => sum + d.quantity * KG_PER_SERVING, 0)

  const run = async (id: string, action: () => Promise<void>) => {
    try {
      setBusyId(id)
      setError("")
      await action()
    } catch (err) {
      console.error("Recycling action failed:", err)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => setHere({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("Couldn't get your location. Allow location access and try again.")
    )

  const card = (d: FoodDonation) => {
    const kg = Math.round(d.quantity * KG_PER_SERVING)
    const poultryOk = suitableFor(d, "poultry").ok
    const km = distanceTo(d)
    const fit = suitableFor(d, myType)
    const takenByOther = d.recycle && d.recycle.byId !== uid
    const mineClaimed = d.recycle?.byId === uid
    const directions =
      d.latitude != null && d.longitude != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.location)}`

    return (
      <div key={d.id} className="overflow-hidden rounded-3xl border bg-white">
        <div className="relative">
          <img src={d.image} alt={d.title} className="h-40 w-full object-cover grayscale-[45%]" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-bold uppercase text-white">
            <TimerOff className="h-3.5 w-3.5" /> Expired {ago(now - expiryMs(d))}
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow">
            {poultryOk ? "🐔 Poultry · 🌱 Compost · ⚡ Biogas" : "🌱 Compost · ⚡ Biogas only"}
          </span>
        </div>

        <div className="p-5">
          <h3 className="font-bold">{d.title}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Scale className="h-4 w-4" /> about {kg} kg · {d.foodType}
          </p>

          {canSeeDetails ? (
            <>
              {/* Pickup details: recyclers (and admins) only */}
              <div className="mt-3 space-y-1.5 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4" /> {d.donorName}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {d.location}
                  {km != null && <span className="font-semibold">· {km.toFixed(1)} km</span>}
                </p>
              </div>

              {/* Contact the donor directly */}
              <DonorContact donation={d} useFor={RECYCLER_TYPES[myType].use} />

              {takenByOther ? (
                <p className="mt-3 rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-800">
                  ♻️ Being collected by {d.recycle!.byName}
                </p>
              ) : mineClaimed ? (
                <button
                  type="button"
                  disabled={busyId === d.id}
                  onClick={() => run(d.id, () => markRecycled(d))}
                  className="mt-3 w-full rounded-full bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:bg-gray-400"
                >
                  {busyId === d.id ? "Saving..." : "Mark collected"}
                </button>
              ) : isRecycler && !fit.ok ? (
                <p className="mt-3 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600">{fit.reason}</p>
              ) : isRecycler && !claimableByRecycler(d) ? (
                <p className="mt-3 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600">
                  Older listing: call or message the donor above to arrange pickup.
                </p>
              ) : isRecycler && profile ? (
                <button
                  type="button"
                  disabled={busyId === d.id}
                  onClick={() => run(d.id, () => claimForRecycling(d.id, { ...profile, recyclerType: myType }))}
                  className="mt-3 w-full rounded-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {busyId === d.id ? "Claiming..." : `Pick up for ${RECYCLER_TYPES[myType].use}`}
                </button>
              ) : null}

              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50"
              >
                <Navigation className="h-4 w-4" /> Directions
              </a>
            </>
          ) : (
            /* Everyone else: pickup details locked */
            <div className="mt-3 rounded-xl border border-dashed px-3 py-3 text-sm text-gray-600">
              <p className="flex items-center gap-2 font-semibold text-gray-800">
                <Lock className="h-4 w-4" /> Pickup details locked
              </p>
              <p className="mt-1">
                Expired food isn't safe for people. Only poultry farms, compost units and biogas plants can collect it.
              </p>
              {!user && (
                <Link to="/signup" className="mt-2 inline-block font-semibold text-black underline">
                  Run a poultry farm, compost or biogas unit? Sign up
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
            <TimerOff className="h-4 w-4" /> Expired
          </p>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            {isRecycler ? `${RECYCLER_TYPES[myType].emoji} Expired food to collect` : "Expired food"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Food whose pickup timer ran out. It's no longer offered to people, so it goes to nearby
            poultry farms, compost units and biogas plants instead of the bin.
          </p>

          {isRecycler && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2 text-green-800">
                <Recycle className="h-4 w-4" />
                <span className="text-xl font-bold tabular-nums">{Math.round(collectedKg)} kg</span>
                <span className="text-sm">kept out of the bin by you</span>
              </span>
              <button
                type="button"
                onClick={locate}
                className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-gray-50"
              >
                📍 {here ? "Sorted by distance" : "Nearest first"}
              </button>
              {myType === "poultry" && (
                <span className="text-sm text-gray-500">
                  Poultry farms only get vegetarian food that doesn't look spoiled.
                </span>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 max-w-2xl rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            {isRecycler && mine.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold">
                  Your pickups <span className="text-base font-medium text-gray-400">({mine.length})</span>
                </h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {mine.map((d) =>
                    d.recycle?.status === "collected" ? (
                      <div key={d.id} className="flex items-center gap-3 rounded-3xl border bg-white p-5">
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
                        <div>
                          <p className="font-semibold">{d.title}</p>
                          <p className="text-sm text-gray-500">
                            Collected · about {Math.round(d.quantity * KG_PER_SERVING)} kg
                          </p>
                        </div>
                      </div>
                    ) : (
                      card(d)
                    )
                  )}
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold">
              {isRecycler ? "Available to pick up" : "Expired listings"}{" "}
              <span className="text-base font-medium text-gray-400">({others.length})</span>
            </h2>
            {others.length === 0 ? (
              <div className="mt-6 rounded-3xl border bg-white px-6 py-16 text-center">
                <p className="text-3xl">🎉</p>
                <p className="mt-3 text-gray-500">No expired food right now. People got it first.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {others.map(card)}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default ExpiredFood

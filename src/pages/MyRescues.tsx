import { ArrowRight, Clock, MapPin, Navigation, Phone, Users } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import StatusTimeline from "../components/StatusTimeline"
import WhatsAppSettings from "../components/WhatsAppSettings"
import { useAuth } from "../context/auth"
import {
  acceptTask,
  markCompleted,
  markPickedUp,
} from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"
import type { FoodDonation, UserProfile } from "../types"
import { formatTime } from "../utils/donationStatus"
import { useNow } from "../hooks/useNow"
import { isExpiredForPeople, RECYCLER_TYPES } from "../utils/recycle"

type Action = (donation: FoodDonation) => Promise<void>

// ------------------------------------------------------------
// One delivery card. Shows the right button for the viewer's role.
// ------------------------------------------------------------
function RescueCard({
  donation,
  uid,
  role,
  onAccept,
  onPickup,
  onComplete,
}: {
  donation: FoodDonation
  uid: string
  role: UserProfile["role"]
  onAccept: Action
  onPickup: (donation: FoodDonation, code: string) => Promise<void>
  onComplete: Action
}) {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const isAdmin = role === "admin"
  const mine = donation.volunteerId === uid
  const myClaim = donation.rescuedBy === uid
  const unassigned = !donation.volunteerId

  // Claimed, but its timer ran out before pickup: not for people any more
  const now = useNow()
  const expiredBeforePickup = isExpiredForPeople(donation, now)

  const canAccept =
    (role === "volunteer" || isAdmin) &&
    donation.status === "claimed" &&
    !expiredBeforePickup &&
    unassigned

  // The assigned volunteer, or the NGO collecting it itself
  const canPickUp =
    donation.status === "claimed" &&
    !expiredBeforePickup &&
    (mine || isAdmin || (myClaim && unassigned))

  const canComplete =
    donation.status === "picked-up" && (myClaim || mine || isAdmin)

  const run = async (action: () => Promise<void>) => {
    try {
      setBusy(true)
      setError("")
      await action()
      setCode("")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const mapsUrl =
    donation.latitude != null && donation.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${donation.latitude},${donation.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donation.location)}`

  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <img
        src={donation.image}
        alt={donation.title}
        className="h-44 w-full object-cover"
      />

      <div className="p-6">
        <h3 className="text-xl font-bold">{donation.title}</h3>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4" /> {donation.quantity} meals · {donation.foodType}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Pickup: {donation.location} ({donation.donorName})
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Before {formatTime(donation.pickupBefore)}
          </p>
          {donation.rescuedByName && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Deliver to: <span className="font-semibold">{donation.rescuedByName}</span>
            </p>
          )}
        </div>

        <div className="mt-5">
          <StatusTimeline donation={donation} variant="compact" />
        </div>

        {/* Status messages */}
        {expiredBeforePickup && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ The pickup timer ran out, so this food is no longer for people.{" "}
            {donation.recycle
              ? `♻️ ${donation.recycle.byName} is collecting it for ${RECYCLER_TYPES[donation.recycle.type].use}.`
              : "♻️ It has moved to Expired Food for poultry farms, compost and biogas units."}
          </p>
        )}
        {!expiredBeforePickup && donation.status === "claimed" && unassigned && myClaim && !isAdmin && (
          <p className="mt-5 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Waiting for a volunteer. You can also collect it yourself with the donor's code.
          </p>
        )}
        {donation.status === "claimed" && !unassigned && !mine && (
          <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            🚴 {donation.volunteerName} is heading to the donor.
          </p>
        )}
        {donation.status === "picked-up" && !canComplete && (
          <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            On the way to {donation.rescuedByName}.
          </p>
        )}

        {/* Actions */}
        {canAccept && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => onAccept(donation))}
            className="mt-5 w-full rounded-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
          >
            {busy ? "Accepting..." : "Accept Delivery Task"}
          </button>
        )}

        {canPickUp && (
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault()
              run(() => onPickup(donation, code))
            }}
          >
            <label className="text-sm font-semibold" htmlFor={`otp-${donation.id}`}>
              Donor's 4-digit pickup code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id={`otp-${donation.id}`}
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="0000"
                className="w-28 rounded-xl border px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:ring-2"
              />
              <button
                type="submit"
                disabled={busy || code.length !== 4}
                className="flex-1 rounded-full bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
              >
                {busy ? "Checking..." : "Mark Picked Up"}
              </button>
            </div>
          </form>
        )}

        {canComplete && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => onComplete(donation))}
            className="mt-5 w-full rounded-full bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:bg-gray-400"
          >
            {busy ? "Saving..." : myClaim ? "Confirm Food Received" : "Mark Delivered"}
          </button>
        )}

        {donation.status === "completed" && (
          <div className="mt-5 rounded-full bg-green-50 px-5 py-3 text-center font-semibold text-green-700">
            ✓ Delivered {formatTime(donation.completedAt)}
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          {(mine || myClaim || isAdmin) && donation.status !== "completed" && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition hover:bg-gray-50"
            >
              <Navigation className="h-4 w-4" /> Directions
            </a>
          )}
          <Link
            to={`/food/${donation.id}`}
            className="flex flex-1 items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition hover:bg-gray-50"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// Section of cards with a heading
// ------------------------------------------------------------
function Section({
  title,
  hint,
  children,
  count,
}: {
  title: string
  hint?: string
  count: number
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold">
        {title} <span className="text-base font-medium text-gray-400">({count})</span>
      </h2>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------
function MyRescues() {
  const { user, profile, role } = useAuth()
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)

  if (!user || !profile || !role) return null

  const uid = user.uid
  const isVolunteer = role === "volunteer"
  const isAdmin = role === "admin"

  const onAccept: Action = (d) => acceptTask(d.id, profile)
  const onPickup = (d: FoodDonation, code: string) => markPickedUp(d.id, profile, code)
  const onComplete: Action = (d) => markCompleted(d.id)

  const relevant = donations.filter((d) => {
    if (d.status === "available" || d.status === "under_review") return false
    if (isAdmin) return true
    // Volunteers don't see open tasks whose food already expired
    if (isVolunteer) return (d.status === "claimed" && !d.volunteerId && !isExpiredForPeople(d)) || d.volunteerId === uid
    return d.rescuedBy === uid
  })

  const openTasks = relevant.filter((d) => d.status === "claimed" && !d.volunteerId)
  const active = relevant.filter(
    (d) => d.status === "picked-up" || (d.status === "claimed" && d.volunteerId)
  )
  const done = relevant.filter((d) => d.status === "completed")

  const card = (d: FoodDonation) => (
    <RescueCard
      key={d.id}
      donation={d}
      uid={uid}
      role={role}
      onAccept={onAccept}
      onPickup={onPickup}
      onComplete={onComplete}
    />
  )

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest">
            {isVolunteer ? "Volunteer" : "Your Impact"}
          </p>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            {isVolunteer ? "My Pickups" : "My Rescues"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            {isVolunteer
              ? "Accept a task, collect the food with the donor's code, and deliver it to the NGO. Updates appear live."
              : "Track the food you claimed, from the donor to your door. Updates appear live."}
          </p>

          {role === "ngo" && <WhatsAppSettings profile={profile} />}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : relevant.length === 0 ? (
          <div className="rounded-3xl border bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
              {isVolunteer ? "🚴" : "🍱"}
            </div>
            <h2 className="mt-6 text-2xl font-bold">
              {isVolunteer ? "No delivery tasks right now" : "No rescues yet"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-gray-500">
              {isVolunteer
                ? "When an NGO claims food, the task appears here instantly."
                : "Find available food and make your first rescue."}
            </p>
            {!isVolunteer && (
              <Link
                to="/food"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                Find Food <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <Section
              title={isVolunteer ? "Open delivery tasks" : "Waiting for a volunteer"}
              hint={isVolunteer ? "Claimed by an NGO, needs a driver." : undefined}
              count={openTasks.length}
            >
              {openTasks.map(card)}
            </Section>
            <Section title="In progress" count={active.length}>
              {active.map(card)}
            </Section>
            <Section title="Delivered" count={done.length}>
              {done.map(card)}
            </Section>
          </>
        )}
      </div>
    </main>
  )
}

export default MyRescues

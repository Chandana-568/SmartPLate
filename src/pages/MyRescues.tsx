import { ArrowRight, Clock, MapPin, Navigation, Phone, Users } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import ContactBox from "../components/ContactBox"
import CountdownTimer from "../components/CountdownTimer"
import MyPhoneBanner from "../components/MyPhoneBanner"
import StatusTimeline from "../components/StatusTimeline"
import WhatsAppSettings from "../components/WhatsAppSettings"
import { useAuth } from "../context/auth"
import {
  acceptTask,
  cancelVolunteerRequest,
  markCompleted,
  markDelivered,
  markPickedUp,
  releaseClaim,
  requestVolunteer,
} from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"
import type { FoodDonation, UserProfile } from "../types"
import { formatTime } from "../utils/donationStatus"
import { useNow } from "../hooks/useNow"
import { isExpiredForPeople, RECYCLER_TYPES } from "../utils/recycle"

type Action = (donation: FoodDonation) => Promise<void>

// Old listings have no flag: they were always open to volunteers
const wantsVolunteer = (d: FoodDonation) => d.volunteerRequested !== false

function minutesAgo(ms?: number | null) {
  if (!ms) return ""
  const min = Math.max(0, Math.round((Date.now() - ms) / 60000))
  return min < 1 ? "just now" : min < 60 ? `${min} min ago` : `${Math.floor(min / 60)} h ${min % 60} min ago`
}

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
  const { profile } = useAuth()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [askOpen, setAskOpen] = useState(false)
  const [note, setNote] = useState("")

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
    wantsVolunteer(donation) &&
    unassigned

  // The assigned volunteer, or the NGO collecting it itself
  const canPickUp =
    donation.status === "claimed" &&
    !expiredBeforePickup &&
    (mine || isAdmin || (myClaim && unassigned))

  // Step 1: the volunteer hands it over. Step 2: the NGO confirms it got it.
  // (An NGO that collected it itself just confirms.)
  const delivered = donation.status === "picked-up" && Boolean(donation.deliveredAt)
  const canMarkDelivered = donation.status === "picked-up" && mine && !myClaim && !delivered
  const canConfirm = donation.status === "picked-up" && (myClaim || isAdmin)

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

        {donation.status === "claimed" && !expiredBeforePickup && (
          <div className="mt-3">
            <CountdownTimer pickupBefore={donation.pickupBefore} />
          </div>
        )}

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
        {/* Volunteer view of an open task: why the NGO needs help */}
        {canAccept && (
          <div className="mt-5 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
            <p className="font-semibold">
              🙋 {donation.rescuedByName ?? "The NGO"} can't collect this and needs a volunteer
            </p>
            {donation.volunteerNote && <p className="mt-1 italic">"{donation.volunteerNote}"</p>}
            {donation.volunteerRequestedAt && (
              <p className="mt-1 text-xs text-orange-700">Asked {minutesAgo(donation.volunteerRequestedAt)}</p>
            )}
          </div>
        )}

        {/* NGO: collect yourself -> ask a volunteer -> release to other NGOs */}
        {!expiredBeforePickup && donation.status === "claimed" && unassigned && myClaim && !isAdmin && (() => {
          const requested = wantsVolunteer(donation)
          const minsLeft = (new Date(donation.pickupBefore).getTime() - now) / 60000
          const waitedMins = donation.volunteerRequestedAt ? (now - donation.volunteerRequestedAt) / 60000 : 0
          // No volunteer after 20 min, or under an hour left: suggest releasing it
          const urgent = requested && (waitedMins >= 20 || minsLeft < 60)

          return (
            <div className="mt-5 space-y-3">
              {requested ? (
                <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
                  <p className="font-semibold">🙋 Volunteer requested {minutesAgo(donation.volunteerRequestedAt)}</p>
                  <p className="mt-1">Every volunteer can see this task now. You'll get their contact when one accepts.</p>
                  {donation.volunteerNote && <p className="mt-1 italic">Your note: "{donation.volunteerNote}"</p>}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => cancelVolunteerRequest(donation.id))}
                    className="mt-2 text-sm font-semibold underline disabled:opacity-50"
                  >
                    We can collect it ourselves after all
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  <p className="font-semibold">🚐 You're collecting this yourself</p>
                  <p className="mt-1">Get the pickup code from the donor and enter it below when you collect.</p>
                  {!askOpen ? (
                    <button
                      type="button"
                      onClick={() => setAskOpen(true)}
                      className="mt-2 w-full rounded-full border-2 border-yellow-700 px-4 py-2 font-semibold text-yellow-900 transition hover:bg-yellow-100"
                    >
                      Can't collect it? Request a volunteer
                    </button>
                  ) : (
                    <form
                      className="mt-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        run(async () => {
                          await requestVolunteer(donation.id, note)
                          setAskOpen(false)
                          setNote("")
                        })
                      }}
                    >
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        maxLength={200}
                        rows={2}
                        placeholder="Optional note, e.g. 'Our van broke down. 30 meals, bring 2 bags.'"
                        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="submit"
                          disabled={busy}
                          className="flex-1 rounded-full bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
                        >
                          {busy ? "Sending..." : "🙋 Request a volunteer"}
                        </button>
                        <button type="button" onClick={() => setAskOpen(false)} className="rounded-full border bg-white px-4 py-2 font-semibold">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Last resort: give it back before it expires */}
              <div className={urgent ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" : ""}>
                {urgent && (
                  <p className="mb-2">
                    ⏰ {minsLeft < 60 ? `Only ${Math.max(0, Math.round(minsLeft))} min left` : "No volunteer for 20 min"}.
                    If nobody can collect it, release it so another NGO nearby can claim it in time.
                  </p>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Release this food? Other NGOs will be able to claim it, and it leaves your list.")) {
                      run(() => releaseClaim(donation.id))
                    }
                  }}
                  className={
                    urgent
                      ? "w-full rounded-full bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:bg-gray-400"
                      : "text-sm font-semibold text-red-600 underline disabled:opacity-50"
                  }
                >
                  Nobody can collect it? Release to other NGOs
                </button>
              </div>
            </div>
          )
        })()}
        {donation.status === "claimed" && !unassigned && !mine && (
          <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            🚴 {donation.volunteerName} is heading to the donor.
          </p>
        )}
        {donation.status === "picked-up" && !delivered && !canMarkDelivered && !(myClaim && mine) && (
          <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            📦 {donation.volunteerName ?? "The volunteer"} has the food, on the way to {donation.rescuedByName}.
          </p>
        )}
        {delivered && mine && !myClaim && (
          <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            ✅ You marked it delivered {formatTime(donation.deliveredAt)}. Waiting for {donation.rescuedByName} to
            confirm they received it.
          </p>
        )}
        {delivered && canConfirm && (
          <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            🚴 {donation.volunteerName ?? "The volunteer"} says it's delivered ({formatTime(donation.deliveredAt)}).
            Check the food and confirm you received it.
          </p>
        )}

        {/* Contacts: only the people actually doing this pickup */}
        {(() => {
          const active = (donation.status === "claimed" && !expiredBeforePickup) || donation.status === "picked-up"
          if (!active) return null
          const demo = Boolean(donation.seed)
          const me = profile?.orgName || profile?.name || "a SharePlate volunteer"
          const collecting = mine || (myClaim && unassigned) || isAdmin
          return (
            <>
              {donation.status === "claimed" && collecting && (
                <ContactBox
                  uid={donation.donorId}
                  name={donation.donorName}
                  label="Donor"
                  demo={demo}
                  smsLabel="Ask for code"
                  sms={
                    `Hi ${donation.donorName}, I'm ${me} from SharePlate, coming to collect "${donation.title}". ` +
                    `Please SMS me the 4-digit pickup code.`
                  }
                />
              )}
              {(myClaim || isAdmin) && donation.volunteerId && !mine && (
                <ContactBox
                  uid={donation.volunteerId}
                  name={donation.volunteerName || "Volunteer"}
                  label="Volunteer delivering it"
                  demo={demo}
                  sms={`Hi ${donation.volunteerName || "there"}, this is ${me} about "${donation.title}" on SharePlate.`}
                />
              )}
              {mine && donation.rescuedBy && !myClaim && (
                <ContactBox
                  uid={donation.rescuedBy}
                  name={donation.rescuedByName || "NGO"}
                  label="Deliver to (NGO)"
                  demo={demo}
                  sms={`Hi ${donation.rescuedByName || "there"}, I'm ${me}, delivering "${donation.title}" from SharePlate.`}
                />
              )}
            </>
          )
        })()}

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

        {canMarkDelivered && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => markDelivered(donation.id))}
            className="mt-5 w-full rounded-full bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:bg-gray-400"
          >
            {busy ? "Saving..." : "🚴 Mark Delivered"}
          </button>
        )}

        {canConfirm && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => onComplete(donation))}
            className={`mt-5 w-full rounded-full px-5 py-3 font-semibold text-white transition disabled:bg-gray-400 ${
              delivered || mine ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-black"
            }`}
          >
            {busy ? "Saving..." : "✅ Confirm Food Received"}
          </button>
        )}

        {donation.status === "completed" && (
          <div className="mt-5 rounded-full bg-green-50 px-5 py-3 text-center font-semibold text-green-700">
            ✓ Received by {donation.rescuedByName ?? "the NGO"} {formatTime(donation.completedAt)}
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
    // ...and only tasks the NGO asked help for
    if (isVolunteer)
      return (d.status === "claimed" && !d.volunteerId && wantsVolunteer(d) && !isExpiredForPeople(d)) || d.volunteerId === uid
    return d.rescuedBy === uid
  })

  // Soonest deadline first
  const openTasks = relevant
    .filter((d) => d.status === "claimed" && !d.volunteerId)
    .sort((a, b) => new Date(a.pickupBefore).getTime() - new Date(b.pickupBefore).getTime())
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
          <MyPhoneBanner why="Donors use it to SMS you the pickup code and to call you at handover." />
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
                ? "When an NGO asks for a volunteer, the task appears here instantly."
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
              title={isVolunteer ? "NGOs asking for help" : "Waiting for pickup"}
              hint={
                isVolunteer
                  ? "These NGOs can't collect the food themselves. Soonest deadline first."
                  : "Collect it yourself, ask a volunteer, or release it if nobody can make it."
              }
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

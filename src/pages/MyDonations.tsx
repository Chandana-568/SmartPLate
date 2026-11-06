import { KeyRound } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import StatusTimeline from "../components/StatusTimeline"
import { useAuth } from "../context/auth"
import {
  cancelDonation,
  getPickupCode,
} from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"
import type { FoodDonation } from "../types"
import { isExpiredForPeople, KG_PER_SERVING, RECYCLER_TYPES } from "../utils/recycle"
import {
  deliveryStage,
  formatTime,
  isExpired,
} from "../utils/donationStatus"

// Badge text + colour for a donation, from the donor's point of view
function badgeFor(donation: FoodDonation) {
  if (donation.status === "under_review") {
    return { label: "Under review", style: "bg-orange-100 text-orange-700" }
  }
  if (donation.recycle) {
    return donation.recycle.status === "collected"
      ? { label: "♻️ Recycled", style: "bg-teal-100 text-teal-800" }
      : { label: "♻️ Being recycled", style: "bg-teal-100 text-teal-800" }
  }
  if (donation.status === "claimed" && isExpiredForPeople(donation)) {
    return { label: "Expired", style: "bg-red-100 text-red-700" }
  }
  if (isExpired(donation)) return { label: "Expired", style: "bg-red-100 text-red-700" }
  switch (deliveryStage(donation)) {
    case "posted":
      return { label: "Available", style: "bg-green-100 text-green-700" }
    case "claimed":
      return { label: "Claimed", style: "bg-yellow-100 text-yellow-700" }
    case "assigned":
      return { label: "Volunteer coming", style: "bg-blue-100 text-blue-700" }
    case "picked-up":
      return { label: "On the way", style: "bg-blue-100 text-blue-700" }
    default:
      return { label: "Delivered", style: "bg-gray-100 text-gray-700" }
  }
}

// The secret code the donor tells the volunteer at handover.
// Only fetched once someone has claimed the food.
function PickupCode({ donationId }: { donationId: string }) {
  const [code, setCode] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    getPickupCode(donationId)
      .then((value) => active && setCode(value))
      .catch((error) => {
        console.error("Pickup code error:", error)
        if (active) setCode(null)
      })
    return () => {
      active = false
    }
  }, [donationId])

  if (code === undefined) return null

  return (
    <div className="mt-5 rounded-2xl border-2 border-dashed border-black px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
        <KeyRound className="h-4 w-4" /> Pickup code
      </p>
      {code ? (
        <>
          <p className="mt-1 text-3xl font-bold tracking-[0.4em]">{code}</p>
          <p className="mt-1 text-xs text-gray-500">
            Share it only with the volunteer when they collect the food.
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-gray-500">
          This older donation has no code. The volunteer can enter any 4 digits.
        </p>
      )}
    </div>
  )
}

function MyDonations() {
  const { user } = useAuth()

  // Live: status badges update the moment an NGO claims or a volunteer picks up
  const allDonations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)
  const error = useCharityStore((state) => state.error)

  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  const donations = allDonations.filter(
    (donation) => donation.donorId === user?.uid
  )

  const handleCancel = async (donation: FoodDonation) => {
    if (!window.confirm(`Remove "${donation.title}"? NGOs will no longer see it.`)) {
      return
    }
    try {
      setCancellingId(donation.id)
      setActionError("")
      await cancelDonation(donation.id)
    } catch (err) {
      console.error("Cancel failed:", err)
      setActionError("Couldn't remove this donation. It may have just been claimed.")
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-16">
        <p className="text-center text-gray-500">Loading your donations...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest">
              Your Contributions
            </p>
            <h1 className="mt-4 text-4xl font-bold md:text-5xl">My Donations</h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-600">
              Track the food you shared, live, from posting to delivery.
            </p>
          </div>
          <Link
            to="/donate"
            className="self-start rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 md:self-auto"
          >
            + Donate Food
          </Link>
        </div>

        {(error || actionError) && (
          <div className="mt-8 rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {error || actionError}
          </div>
        )}

        {!error && donations.length === 0 && (
          <div className="mt-12 rounded-3xl border bg-white px-6 py-16 text-center">
            <h2 className="text-2xl font-bold">You haven't donated any food yet.</h2>
            <p className="mt-3 text-gray-500">Your donated food will appear here.</p>
          </div>
        )}

        {donations.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {donations.map((donation) => {
              const badge = badgeFor(donation)
              const expiredForPeople = isExpiredForPeople(donation)
              const showCode = donation.status === "claimed" && !expiredForPeople
              const canRemove =
                (donation.status === "available" || donation.status === "under_review") && !donation.recycle

              return (
                <div key={donation.id} className="overflow-hidden rounded-3xl border bg-white">
                  <img
                    src={donation.image}
                    alt={donation.title}
                    className="h-44 w-full object-cover"
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-xl font-bold">{donation.title}</h2>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.style}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold">Meals:</span> {donation.quantity} ·{" "}
                        {donation.foodType}
                      </p>
                      <p>
                        <span className="font-semibold">Pickup before:</span>{" "}
                        {formatTime(donation.pickupBefore)}
                      </p>
                    </div>

                    {donation.status === "under_review" && (
                      <p className="mt-5 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
                        Our AI screening flagged this listing, so an admin will check it before NGOs can see it.
                        {donation.riskReasons?.length ? ` Reason: ${donation.riskReasons[0]}.` : ""}
                      </p>
                    )}

                    {showCode && <PickupCode donationId={donation.id} />}

                    {/* Expired: where the food goes instead of the bin */}
                    {donation.recycle ? (
                      <p className="mt-5 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
                        ♻️ {donation.recycle.status === "collected" ? "Collected by" : "Being picked up by"}{" "}
                        <span className="font-semibold">{donation.recycle.byName}</span> for{" "}
                        {RECYCLER_TYPES[donation.recycle.type].use} (about{" "}
                        {Math.round(donation.quantity * KG_PER_SERVING)} kg kept out of the bin).
                      </p>
                    ) : expiredForPeople ? (
                      <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        ⏰ The pickup timer ran out. It's listed in Expired Food so a nearby poultry farm,
                        compost or biogas unit can collect it.
                      </p>
                    ) : null}

                    <div className="mt-6">
                      <StatusTimeline donation={donation} />
                    </div>

                    {canRemove && (
                      <button
                        type="button"
                        disabled={cancellingId === donation.id}
                        onClick={() => handleCancel(donation)}
                        className="mt-6 w-full rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancellingId === donation.id
                          ? "Removing..."
                          : isExpired(donation)
                            ? "Remove Expired Listing"
                            : "Cancel Donation"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export default MyDonations

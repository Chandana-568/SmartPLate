import {
  Clock,
  MapPin,
  Users,
  Navigation,
  ArrowLeft,
} from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useAuth } from "../context/auth"
import AIInsightBox from "../components/AIInsightBox"
import StatusTimeline from "../components/StatusTimeline"
import CountdownTimer from "../components/CountdownTimer"
import { useNow } from "../hooks/useNow"
import { isExpiredForPeople, RECYCLER_TYPES } from "../utils/recycle"
import { claimDonation } from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"
import {
  formatTime,
  isExpired,
  isOpenForClaim,
} from "../utils/donationStatus"

function FoodDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, role } = useAuth()

  const donations = useCharityStore(
    (state) => state.donations
  )
  const loading = useCharityStore((state) => state.loading)

  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState("")
  const now = useNow() // re-check expiry every second

  const donation = donations.find(
    (item) => item.id === id
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-20">
        <p className="text-center text-gray-500">Loading...</p>
      </main>
    )
  }

  // Donation not found
  if (!donation) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">

          <h1 className="text-3xl font-bold">
            Food donation not found
          </h1>

          <p className="mt-3 text-gray-600">
            This donation may have been removed or
            does not exist.
          </p>

          <Link
            to="/food"
            className="mt-8 inline-flex items-center gap-2
            rounded-full bg-black px-6 py-3 font-semibold
            text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Food
          </Link>

        </div>
      </main>
    )
  }

  // Open location in Google Maps
  const openInMaps = () => {
    const query =
      donation.latitude != null && donation.longitude != null
        ? `${donation.latitude},${donation.longitude}`
        : encodeURIComponent(donation.location)

    const url =
      `https://www.google.com/maps/search/?api=1&query=${query}`

    window.open(url, "_blank", "noopener")
  }

  const canClaim = role === "ngo" || role === "admin"
  const expired = isExpired(donation, now)
  // Expired before pickup: location is for poultry / compost / biogas only
  const expiredForPeople = isExpiredForPeople(donation, now)
  const lockDetails = expiredForPeople && role !== "recycler" && role !== "admin"
  const open = isOpenForClaim(donation, now)

  // Claim donation (NGOs only)
  const handleClaim = async (needVolunteer: boolean) => {
    if (!user) {
      navigate("/login")
      return
    }

    if (!profile || !open) return

    try {
      setClaiming(true)
      setClaimError("")
      await claimDonation(donation.id, profile, needVolunteer)
      navigate("/my-rescues")
    } catch (error) {
      console.error("Claim failed:", error)
      setClaimError(
        error instanceof Error
          ? error.message
          : "Unable to claim this food. Please try again."
      )
    } finally {
      setClaiming(false)
    }
  }

  const claimLabel = expired
    ? "Pickup time has passed"
    : donation.status !== "available"
      ? donation.status === "claimed"
        ? `Claimed by ${donation.rescuedByName ?? "an NGO"}`
        : "Food Unavailable"
      : !user
        ? "Login as an NGO to Claim"
        : !canClaim
          ? "Only NGOs can claim food"
          : claiming
            ? "Claiming..."
            : "Claim This Food"

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Back Button */}
      <div className="mx-auto max-w-6xl px-6 pt-8">

        <Link
          to="/food"
          className="inline-flex items-center gap-2
          text-sm font-semibold text-gray-600
          hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Food
        </Link>

      </div>

      {/* Details */}
      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="overflow-hidden rounded-3xl
          border bg-white shadow-sm">

          <div className="grid lg:grid-cols-2">

            {/* Image */}
            <div className="h-80 lg:h-full">

              <img
                src={donation.image}
                alt={donation.title}
                className="h-full w-full object-cover"
              />

            </div>

            {/* Information */}
            <div className="p-8 lg:p-12">

              {/* Status */}
              <span
                className={`inline-block rounded-full px-4 py-2
                text-sm font-semibold ${
                  expired
                    ? "bg-red-100 text-red-700"
                    : donation.status === "available"
                      ? "bg-green-100 text-green-700"
                      : donation.status === "claimed"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                }`}
              >
                {donation.status === "under_review"
                  ? "Under Review"
                  : expired
                  ? "Expired"
                  : donation.status === "available"
                    ? "Available"
                    : donation.status === "claimed"
                      ? "Claimed"
                      : donation.status === "picked-up"
                        ? donation.deliveredAt
                          ? "Delivered, awaiting NGO"
                          : "Picked Up"
                        : "Received by NGO"}
              </span>

              {/* Urgency */}
              <div className="mt-3">

                <span
                  className={`inline-block rounded-full px-4 py-2
                  text-sm font-semibold ${
                    donation.urgency === "high"
                      ? "bg-red-100 text-red-700"
                      : donation.urgency === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {donation.urgency === "high"
                    ? "Urgent"
                    : donation.urgency === "medium"
                      ? "Pickup Soon"
                      : "Available"}
                </span>

              </div>

              {/* Title */}
              <h1 className="mt-5 text-4xl font-bold">
                {donation.title}
              </h1>

              {/* Description */}
              <p className="mt-4 leading-7 text-gray-600">
                {donation.description}
              </p>

              {/* Information */}
              <div className="mt-8 space-y-5">

                {/* Quantity */}
                <div className="flex items-center gap-4">

                  <div className="rounded-full bg-gray-100 p-3">
                    <Users className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Quantity
                    </p>

                    <p className="font-semibold">
                      {donation.quantity} meals
                    </p>
                  </div>

                </div>

                {/* Food Type */}
                <div className="flex items-center gap-4">

                  <div className="rounded-full bg-gray-100 p-3">
                    🍱
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Food Type
                    </p>

                    <p className="font-semibold">
                      {donation.foodType}
                    </p>
                  </div>

                </div>

                {/* Location */}
                <div className="flex items-center gap-4">

                  <div className="rounded-full bg-gray-100 p-3">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Pickup Location
                    </p>

                    <p className="font-semibold">
                      {lockDetails ? "🔒 Locked: expired food" : donation.location}
                    </p>
                  </div>

                </div>

                {/* Pickup Time */}
                <div className="flex items-center gap-4">

                  <div className="rounded-full bg-gray-100 p-3">
                    <Clock className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Pickup Before
                    </p>

                    <p className={`font-semibold ${expired ? "text-red-600" : ""}`}>
                      {formatTime(donation.pickupBefore)}
                      {expired && " (expired)"}
                    </p>

                    <div className="mt-2">
                      <CountdownTimer pickupBefore={donation.pickupBefore} size="lg" />
                    </div>
                  </div>

                </div>

                {/* Donor */}
                <div className="flex items-center gap-4">

                  <div className="rounded-full bg-gray-100 p-3">
                    👤
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Donated By
                    </p>

                    <p className="font-semibold">
                      {donation.donorName}
                    </p>
                  </div>

                </div>

              </div>

              {/* Expired: only poultry / compost / biogas may see where to collect */}
              {expiredForPeople && (
                <div className="mt-8 rounded-2xl border border-dashed px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold">♻️ Expired: not for people any more</p>
                  {donation.recycle ? (
                    <p className="mt-1">
                      {donation.recycle.status === "collected" ? "Collected by" : "Being collected by"}{" "}
                      <span className="font-semibold">{donation.recycle.byName}</span> for{" "}
                      {RECYCLER_TYPES[donation.recycle.type].use}.
                    </p>
                  ) : (
                    <p className="mt-1">
                      Poultry farms, compost units and biogas plants can collect it from the{" "}
                      <Link to="/expired" className="font-semibold underline">Expired Food</Link> page.
                    </p>
                  )}
                </div>
              )}

              {/* Open Maps (hidden for expired food unless you can collect it) */}
              {!lockDetails && (
                <button
                  type="button"
                  onClick={openInMaps}
                  className="mt-8 flex w-full items-center
                  justify-center gap-2 rounded-full border
                  px-6 py-3 font-semibold transition
                  hover:bg-gray-50"
                >
                  <Navigation className="h-4 w-4" />
                  Open Location in Maps
                </button>
              )}

              {/* Claim: NGO says up front whether it can collect the food itself */}
              {open && user && canClaim ? (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Claim this food. How will it reach you?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleClaim(false)}
                      disabled={claiming}
                      className="rounded-full bg-black px-5 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-300"
                    >
                      {claiming ? "Claiming..." : "🚐 We'll collect it"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClaim(true)}
                      disabled={claiming}
                      className="rounded-full border-2 border-black px-5 py-4 font-semibold transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      {claiming ? "Claiming..." : "🙋 Need a volunteer"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    "Need a volunteer" sends it to volunteers right away. You can still ask for one later from My Rescues.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => (user ? undefined : navigate("/login"))}
                  disabled={Boolean(user) || !open}
                  className="mt-3 w-full rounded-full
                  bg-black px-6 py-4 font-semibold text-white
                  transition hover:bg-gray-800
                  disabled:cursor-not-allowed
                  disabled:bg-gray-300"
                >
                  {claimLabel}
                </button>
              )}

              {claimError && (
                <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {claimError}
                </p>
              )}

              {donation.aiAnalysis && (
                <div className="mt-8">
                  <AIInsightBox analysis={donation.aiAnalysis} />
                </div>
              )}

              {/* Live delivery timeline */}
              <div className="mt-10 border-t pt-8">
                <h2 className="mb-5 text-lg font-bold">Delivery progress</h2>
                <StatusTimeline donation={donation} />
              </div>

            </div>

          </div>

        </div>

      </section>
    </main>
  )
}

export default FoodDetails
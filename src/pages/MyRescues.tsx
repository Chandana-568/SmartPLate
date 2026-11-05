import { Clock, MapPin, Users, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { useState } from "react"

import { useAuth } from "../context/AuthContext"
import {
  markCompleted,
  markPickedUp,
} from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"
import type { FoodDonation } from "../types"

function MyRescues() {
  const { user, profile, role } = useAuth()

  const donations = useCharityStore(
    (state) => state.donations
  )

  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  const uid = user?.uid
  const isVolunteer = role === "volunteer"

  // NGO: food it claimed. Volunteer: claimed food waiting for a driver,
  // plus deliveries this volunteer picked up. Admin: everything in progress.
  const claimedDonations = donations.filter((donation) => {
    if (donation.status === "available") return false
    if (role === "admin") return true
    if (isVolunteer) {
      return (
        (donation.status === "claimed" && !donation.volunteerId) ||
        donation.volunteerId === uid
      )
    }
    return donation.rescuedBy === uid
  })

  const canPickUp = (donation: FoodDonation) =>
    donation.status === "claimed" &&
    (isVolunteer || donation.rescuedBy === uid || role === "admin")

  const canComplete = (donation: FoodDonation) =>
    donation.status === "picked-up" &&
    (donation.rescuedBy === uid ||
      donation.volunteerId === uid ||
      role === "admin")

  const runAction = async (id: string, action: () => Promise<void>) => {
    try {
      setBusyId(id)
      setActionError("")
      await action()
    } catch (error) {
      console.error("Status update failed:", error)
      setActionError("Couldn't update this rescue. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  const handlePickup = (id: string) => {
    if (!profile) return
    runAction(id, () => markPickedUp(id, profile))
  }

  const handleComplete = (id: string) => {
    runAction(id, () => markCompleted(id))
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="text-sm font-semibold uppercase tracking-widest">
            Your Impact
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            {isVolunteer ? "My Pickups" : "My Rescues"}
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            {isVolunteer
              ? "Pick up claimed food from donors and deliver it to NGOs."
              : "Keep track of the food donations you've rescued from the community."}
          </p>

          {actionError && (
            <p className="mt-6 max-w-2xl rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {actionError}
            </p>
          )}

        </div>
      </section>

      {/* Rescues */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        {claimedDonations.length === 0 ? (

          /* Empty State */
          <div className="rounded-3xl border bg-white px-6 py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center
              justify-center rounded-full bg-gray-100 text-3xl">
              🍱
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              No rescues yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-500">
              {isVolunteer
                ? "No pickups waiting right now. Claimed food will appear here live."
                : "You haven't claimed any food yet. Find available food and make your first rescue."}
            </p>

            <Link
              to="/food"
              className="mt-8 inline-flex items-center gap-2
              rounded-full bg-black px-6 py-3 font-semibold
              text-white transition hover:bg-gray-800"
            >
              Find Food
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

        ) : (

          <>
            {/* Results Header */}
            <div className="mb-8">

              <h2 className="text-2xl font-bold">
                Your Rescued Food
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {claimedDonations.length} rescue
                {claimedDonations.length !== 1 ? "s" : ""}
              </p>

            </div>

            {/* Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {claimedDonations.map((donation) => (

                <div
                  key={donation.id}
                  className="overflow-hidden rounded-3xl
                  border bg-white shadow-sm transition
                  hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">

                    <img
                      src={donation.image}
                      alt={donation.title}
                      className="h-full w-full object-cover"
                    />

                    {/* Status */}
                    <div className="absolute left-4 top-4">

                      <span
                        className={`rounded-full px-3 py-1
                        text-xs font-semibold ${
                          donation.status === "claimed"
                            ? "bg-yellow-100 text-yellow-700"
                            : donation.status === "picked-up"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {donation.status === "claimed"
                          ? "Claimed"
                          : donation.status === "picked-up"
                            ? "Picked Up"
                            : "Completed"}
                      </span>

                    </div>

                  </div>

                  {/* Content */}
                  <div className="p-6">

                    <h3 className="text-xl font-bold">
                      {donation.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {donation.description}
                    </p>

                    <div className="mt-5 space-y-3 text-sm text-gray-600">

                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {donation.quantity} meals
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {donation.location}
                        </span>
                      </div>

                      {/* Pickup */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Pickup before{" "}
                          {donation.pickupBefore}
                        </span>
                      </div>

                    </div>

                    {/* Action Buttons */}
                    {/* Rescue Progress */}
<div className="mt-6">

  <p className="mb-3 text-sm font-semibold text-gray-700">
    Rescue Progress
  </p>

  <div className="flex items-center">

    {/* Claimed */}
    <div
      className={`h-3 w-3 rounded-full ${
        donation.status === "claimed" ||
        donation.status === "picked-up" ||
        donation.status === "completed"
          ? "bg-black"
          : "bg-gray-200"
      }`}
    />

    <div
      className={`h-1 flex-1 ${
        donation.status === "picked-up" ||
        donation.status === "completed"
          ? "bg-black"
          : "bg-gray-200"
      }`}
    />

    {/* Picked Up */}
    <div
      className={`h-3 w-3 rounded-full ${
        donation.status === "picked-up" ||
        donation.status === "completed"
          ? "bg-black"
          : "bg-gray-200"
      }`}
    />

    <div
      className={`h-1 flex-1 ${
        donation.status === "completed"
          ? "bg-black"
          : "bg-gray-200"
      }`}
    />

    {/* Completed */}
    <div
      className={`h-3 w-3 rounded-full ${
        donation.status === "completed"
          ? "bg-black"
          : "bg-gray-200"
      }`}
    />

  </div>

  <div className="mt-2 flex justify-between text-xs text-gray-500">
    <span>Claimed</span>
    <span>Picked Up</span>
    <span>Completed</span>
  </div>

</div>

                    {donation.rescuedByName && (
                      <p className="mt-4 text-xs text-gray-500">
                        For <span className="font-semibold">{donation.rescuedByName}</span>
                        {donation.volunteerName && (
                          <> · Driver <span className="font-semibold">{donation.volunteerName}</span></>
                        )}
                      </p>
                    )}

                    {canPickUp(donation) && (
                      <button
                        type="button"
                        disabled={busyId === donation.id}
                        onClick={() =>
                          handlePickup(donation.id)
                        }
                        className="mt-6 w-full rounded-full
                        bg-black px-5 py-3 font-semibold
                        text-white transition hover:bg-gray-800"
                      >
                        Mark as Picked Up
                      </button>
                    )}

                    {donation.status === "picked-up" && !canComplete(donation) && (
                      <div className="mt-6 rounded-full bg-blue-50 px-5 py-3 text-center text-sm font-semibold text-blue-700">
                        On the way to the NGO
                      </div>
                    )}

                    {canComplete(donation) && (
                      <button
                        type="button"
                        disabled={busyId === donation.id}
                        onClick={() =>
                          handleComplete(donation.id)
                        }
                        className="mt-6 w-full rounded-full
                        bg-black px-5 py-3 font-semibold
                        text-white transition hover:bg-gray-800"
                      >
                        Complete Rescue
                      </button>
                    )}

                    {donation.status === "completed" && (
                      <div
                        className="mt-6 rounded-full bg-green-50
                        px-5 py-3 text-center font-semibold
                        text-green-700"
                      >
                        ✓ Rescue Completed
                      </div>
                    )}

                    {/* Details */}
                    <Link
                      to={`/food/${donation.id}`}
                      className="mt-3 block w-full rounded-full
                      border px-5 py-3 text-center font-semibold
                      transition hover:bg-gray-50"
                    >
                      View Details
                    </Link>

                  </div>

                </div>

              ))}

            </div>
          </>

        )}

      </section>
    </main>
  )
}

export default MyRescues
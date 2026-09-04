import {
  Clock,
  MapPin,
  Users,
  Navigation,
  ArrowLeft,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { useCharityStore } from "../store/useCharityStore"

function FoodDetails() {
  const { id } = useParams()

  const donations = useCharityStore(
    (state) => state.donations
  )

  const updateDonationStatus = useCharityStore(
    (state) => state.updateDonationStatus
  )

  const donation = donations.find(
    (item) => item.id === id
  )

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
    const url =
      `https://www.google.com/maps/search/?api=1&query=` +
      `${donation.latitude},${donation.longitude}`

    window.open(url, "_blank")
  }

  // Claim donation
  const handleClaim = () => {
    if (donation.status === "available") {
      updateDonationStatus(
        donation.id,
        "claimed"
      )
    }
  }

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
                  donation.status === "available"
                    ? "bg-green-100 text-green-700"
                    : donation.status === "claimed"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {donation.status === "available"
                  ? "Available"
                  : donation.status === "claimed"
                    ? "Claimed"
                    : donation.status}
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
                      {donation.location}
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

                    <p className="font-semibold">
                      {donation.pickupBefore}
                    </p>
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

              {/* Open Maps */}
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

              {/* Claim Button */}
              <button
                type="button"
                onClick={handleClaim}
                disabled={donation.status !== "available"}
                className="mt-3 w-full rounded-full
                bg-black px-6 py-4 font-semibold text-white
                transition hover:bg-gray-800
                disabled:cursor-not-allowed
                disabled:bg-gray-300"
              >
                {donation.status === "available"
                  ? "Claim This Food"
                  : donation.status === "claimed"
                    ? "Food Already Claimed"
                    : "Food Unavailable"}
              </button>

            </div>

          </div>

        </div>

      </section>
    </main>
  )
}

export default FoodDetails
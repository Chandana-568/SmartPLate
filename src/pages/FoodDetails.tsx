import { ArrowLeft, Clock, MapPin, Users } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { useCharityStore } from "../store/useCharityStore"

function FoodDetails() {
  const { id } = useParams()

 const donations = useCharityStore((state) => state.donations)
const updateDonationStatus = useCharityStore(
  (state) => state.updateDonationStatus
)

  const donation = donations.find(
    (item) => item.id === id
  )
const handleClaim = () => {
  if (!donation) return

  updateDonationStatus(donation.id, "claimed")
}
  if (!donation) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Food donation not found
          </h1>

          <Link
            to="/food"
            className="mt-6 inline-flex items-center gap-2 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to food
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Back */}
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <Link
          to="/food"
          className="inline-flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to available food
        </Link>
      </div>

      {/* Details */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid overflow-hidden rounded-3xl border bg-white md:grid-cols-2">

          {/* Image */}
          <div className="h-full min-h-[400px]">
            <img
              src={donation.image}
              alt={donation.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">

            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                donation.urgency === "high"
                  ? "bg-red-100 text-red-700"
                  : donation.urgency === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {donation.urgency === "high"
                ? "Urgent Pickup"
                : donation.urgency === "medium"
                  ? "Pickup Soon"
                  : "Available"}
            </span>

            <h1 className="mt-5 text-4xl font-bold">
              {donation.title}
            </h1>

            <p className="mt-5 leading-7 text-gray-600">
              {donation.description}
            </p>

            {/* Information */}
            <div className="mt-8 space-y-5">

              <div className="flex items-center gap-4">
                <Users className="h-5 w-5" />

                <div>
                  <p className="text-sm text-gray-500">
                    Quantity
                  </p>

                  <p className="font-semibold">
                    {donation.quantity} meals
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <MapPin className="h-5 w-5" />

                <div>
                  <p className="text-sm text-gray-500">
                    Pickup Location
                  </p>

                  <p className="font-semibold">
                    {donation.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5" />

                <div>
                  <p className="text-sm text-gray-500">
                    Pickup Before
                  </p>

                  <p className="font-semibold">
                    {donation.pickupBefore}
                  </p>
                </div>
              </div>

            </div>

            {/* Donor */}
            <div className="mt-8 rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Donated by
              </p>

              <p className="mt-1 font-semibold">
                {donation.donorName}
              </p>
            </div>

            {/* Action */}
           <button
  onClick={handleClaim}
  disabled={donation.status !== "available"}
  className="mt-8 w-full rounded-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
>
  {donation.status === "available"
    ? "Claim This Food"
    : "Already Claimed"}
</button>

          </div>
        </div>
      </section>
    </main>
  )
}

export default FoodDetails
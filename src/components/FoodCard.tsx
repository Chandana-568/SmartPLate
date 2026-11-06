import { Clock, MapPin, Users, Navigation } from "lucide-react"
import { Link } from "react-router-dom"
import type { FoodDonation } from "../types"
import { formatTime } from "../utils/donationStatus"
import { riskLevel } from "../utils/riskScore"
import CountdownTimer from "./CountdownTimer"

interface FoodCardProps {
  donation: FoodDonation
  distance?: number | null
}

function FoodCard({ donation, distance }: FoodCardProps) {
  const openInMaps = () => {
    const query =
      donation.latitude != null && donation.longitude != null
        ? `${donation.latitude},${donation.longitude}`
        : encodeURIComponent(donation.location)

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank",
      "noopener"
    )
  }

  return (
    <div className="group overflow-hidden rounded-3xl border bg-white transition duration-300 hover:-translate-y-2 hover:shadow-xl">

      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={donation.image}
          alt={donation.title}
          onError={(event) => {
            // Broken or deleted photo: show a neutral food picture instead
            const img = event.currentTarget
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1"
              img.src = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=70&fm=jpg"
            }
          }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* AI screening badge */}
        {donation.aiAnalysis && (
          <div className="absolute right-4 top-4">
            {riskLevel(donation.riskScore) === "ok" ? (
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-green-700 shadow">
                ✓ AI-verified
              </span>
            ) : (
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-yellow-700 shadow">
                ⚠ Unverified
              </span>
            )}
          </div>
        )}

        {/* Urgency Badge */}
        <div className="absolute left-4 top-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
            <span>{donation.quantity} meals</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{donation.location}</span>
          </div>

          {/* Distance */}
          {distance !== null && distance !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>📏</span>
              <span>{distance.toFixed(1)} km away</span>
            </div>
          )}

          {/* Pickup Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              Pickup before {formatTime(donation.pickupBefore)}
            </span>
          </div>

        </div>

        {/* Live countdown: turns into EXPIRED when time is up */}
        <div className="mt-4">
          <CountdownTimer pickupBefore={donation.pickupBefore} />
        </div>

        {/* Map Button */}
        <button
          type="button"
          onClick={openInMaps}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 font-semibold transition hover:bg-gray-50"
        >
          <Navigation className="h-4 w-4" />
          View on Map
        </button>

        {/* View Details */}
        <Link
          to={`/food/${donation.id}`}
          className="mt-3 block w-full rounded-full bg-black px-5 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
        >
          View Details
        </Link>

      </div>
    </div>
  )
}

export default FoodCard
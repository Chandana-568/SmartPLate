import { Clock, MapPin, Users } from "lucide-react"
import { Link } from "react-router-dom"
import type { FoodDonation } from "../types"

interface FoodCardProps {
  donation: FoodDonation
}

function FoodCard({ donation }: FoodCardProps) {
  return (
    <div className="group overflow-hidden rounded-3xl border bg-white transition duration-300 hover:-translate-y-2 hover:shadow-xl">

      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={donation.image}
          alt={donation.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

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

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{donation.quantity} meals</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{donation.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pickup before {donation.pickupBefore}</span>
          </div>

        </div>

       <Link
  to={`/food/${donation.id}`}
  className="mt-6 block w-full rounded-full bg-black px-5 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
>
  View Details
</Link>

      </div>
    </div>
  )
}

export default FoodCard
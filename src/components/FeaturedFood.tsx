import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import FoodCard from "./FoodCard"
import { useCharityStore } from "../store/useCharityStore"
import { isOpenForClaim } from "../utils/donationStatus"
import { useNow } from "../hooks/useNow"

function FeaturedFood() {
  const donations = useCharityStore(
    (state) => state.donations
  )
  const now = useNow()

  const availableDonations = donations
    .filter((donation) => isOpenForClaim(donation, now))
    .slice(0, 3)

  return (
    <section className="bg-gray-50 px-6 py-24">

      <div className="mx-auto max-w-7xl">

        {/* Section Heading */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest">
              Food rescue
            </p>

            <h2 className="mt-4 text-4xl font-bold md:text-5xl">
              Food waiting to be rescued.
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-600">
              Discover surplus food available near you and help
              get it to someone who needs it.
            </p>
          </div>

          <Link
            to="/food"
            className="flex items-center gap-2 font-semibold"
          >
            View all food
            <ArrowRight className="h-5 w-5" />
          </Link>

        </div>

        {/* Food Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {availableDonations.map((donation) => (
            <FoodCard
              key={donation.id}
              donation={donation}
            />
          ))}

        </div>

      </div>

    </section>
  )
}

export default FeaturedFood
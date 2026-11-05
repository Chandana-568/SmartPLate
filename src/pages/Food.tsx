import { Search } from "lucide-react"
import { useState } from "react"

import FoodCard from "../components/FoodCard"
import { useCharityStore } from "../store/useCharityStore"
import { calculateDistance } from "../utils/distance"
import { isOpenForClaim } from "../utils/donationStatus"

function Food() {
  // Live data from the app-wide Firestore subscription
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)
  const firebaseError = useCharityStore((state) => state.error)

  const [search, setSearch] = useState("")
  const [foodType, setFoodType] = useState("all")
  const [urgency, setUrgency] = useState("all")

  const [userLatitude, setUserLatitude] =
    useState<number | null>(null)

  const [userLongitude, setUserLongitude] =
    useState<number | null>(null)

  const [locationLoading, setLocationLoading] =
    useState(false)

  const [locationError, setLocationError] =
    useState("")

  const [distanceFilter, setDistanceFilter] =
    useState("all")

  // --------------------------------
  // Get user's location
  // --------------------------------

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      )
      return
    }

    setLocationLoading(true)
    setLocationError("")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLatitude(
          position.coords.latitude
        )

        setUserLongitude(
          position.coords.longitude
        )

        setLocationLoading(false)
      },
      () => {
        setLocationError(
          "Unable to get your location. Please allow location access."
        )

        setLocationLoading(false)
      }
    )
  }

  // --------------------------------
  // Available donations
  // --------------------------------

  // Unclaimed and still before its pickup deadline
  const availableDonations =
    donations.filter((donation) => isOpenForClaim(donation))

  // --------------------------------
  // Search + filters
  // --------------------------------

  const filteredDonations =
    availableDonations.filter(
      (donation) => {
        const matchesSearch =
          `${donation.title} ${donation.location} ${donation.foodType}`
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )

        const matchesFoodType =
          foodType === "all" ||
          donation.foodType === foodType

        const matchesUrgency =
          urgency === "all" ||
          donation.urgency === urgency

        return (
          matchesSearch &&
          matchesFoodType &&
          matchesUrgency
        )
      }
    )

  // --------------------------------
  // Calculate distance
  // --------------------------------

  const donationsWithDistance =
    filteredDonations.map((donation) => {
      if (
        userLatitude === null ||
        userLongitude === null ||
        donation.latitude == null ||
        donation.longitude == null
      ) {
        return {
          ...donation,
          distance: null,
        }
      }

      return {
        ...donation,
        distance: calculateDistance(
          userLatitude,
          userLongitude,
          donation.latitude,
          donation.longitude
        ),
      }
    })

  // --------------------------------
  // Sort nearest first
  // --------------------------------

  const sortedDonations =
    [...donationsWithDistance].sort(
      (a, b) => {
        if (a.distance === null) {
          return 1
        }

        if (b.distance === null) {
          return -1
        }

        return a.distance - b.distance
      }
    )

  // --------------------------------
  // Distance filter
  // --------------------------------

  const nearbyDonations =
    sortedDonations.filter(
      (donation) => {
        if (distanceFilter === "all") {
          return true
        }

        if (donation.distance === null) {
          return false
        }

        return (
          donation.distance <=
          Number(distanceFilter)
        )
      }
    )

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}

      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="text-sm font-semibold uppercase tracking-widest">
            Food Rescue
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Find food near you.
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Discover surplus food available for
            rescue and help connect it with people
            who need it.
          </p>

        </div>
      </section>

      {/* Search + Filters */}

      <section className="mx-auto max-w-7xl px-6 py-12">

        {/* Search */}

        <div className="relative max-w-xl">

          <Search
            className="absolute left-4 top-1/2 h-5 w-5
            -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by food, location..."
            className="w-full rounded-full border bg-white
            py-4 pl-12 pr-5 outline-none transition
            focus:ring-2"
          />

        </div>

        {/* Filters */}

        <div className="mt-4 flex flex-wrap gap-3">

          {/* Food Type */}

          <select
            value={foodType}
            onChange={(event) =>
              setFoodType(event.target.value)
            }
            className="rounded-full border bg-white px-5 py-3
            text-sm outline-none"
          >
            <option value="all">
              All Food Types
            </option>

            <option value="Vegetarian">
              Vegetarian
            </option>

            <option value="Mixed">
              Mixed
            </option>
          </select>

          {/* Urgency */}

          <select
            value={urgency}
            onChange={(event) =>
              setUrgency(event.target.value)
            }
            className="rounded-full border bg-white px-5 py-3
            text-sm outline-none"
          >
            <option value="all">
              All Urgency
            </option>

            <option value="high">
              Urgent
            </option>

            <option value="medium">
              Pickup Soon
            </option>

            <option value="low">
              Available
            </option>
          </select>

          {/* Location */}

          <button
            type="button"
            onClick={getUserLocation}
            disabled={locationLoading}
            className="rounded-full border bg-white px-5 py-3
            text-sm font-semibold transition hover:bg-gray-50
            disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locationLoading
              ? "Getting location..."
              : "📍 Get My Location"}
          </button>

          {/* Distance */}

          <select
            value={distanceFilter}
            onChange={(event) =>
              setDistanceFilter(event.target.value)
            }
            className="rounded-full border bg-white px-5 py-3
            text-sm outline-none"
          >
            <option value="all">
              📍 All Distances
            </option>

            <option value="2">
              Within 2 km
            </option>

            <option value="5">
              Within 5 km
            </option>

            <option value="10">
              Within 10 km
            </option>
          </select>

        </div>

        {/* Location Error */}

        {locationError && (
          <p className="mt-4 text-sm text-red-600">
            {locationError}
          </p>
        )}

        {/* Location Success */}

        {userLatitude !== null &&
          userLongitude !== null && (
            <p className="mt-4 text-sm text-green-600">
              ✓ Your location has been detected.
            </p>
          )}

        {/* Firebase Error */}

        {firebaseError && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {firebaseError}
          </p>
        )}

        {/* Results */}

        <div className="mt-10">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-2xl font-bold">
              Available food
            </h2>

            {!loading && (
              <p className="text-sm text-gray-500">
                {nearbyDonations.length} results
              </p>
            )}

          </div>

          {/* Loading */}

          {loading ? (

            <div className="rounded-3xl border bg-white px-6 py-16 text-center">

              <p className="text-gray-500">
                Loading available food...
              </p>

            </div>

          ) : nearbyDonations.length > 0 ? (

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {nearbyDonations.map(
                (donation) => (
                  <FoodCard
                    key={donation.id}
                    donation={donation}
                    distance={donation.distance}
                  />
                )
              )}

            </div>

          ) : (

            <div className="rounded-3xl border bg-white px-6 py-16 text-center">

              <h3 className="text-xl font-bold">
                No food found nearby
              </h3>

              <p className="mt-2 text-gray-500">
                Try increasing the distance or
                changing your search filters.
              </p>

            </div>

          )}

        </div>

      </section>

    </main>
  )
}

export default Food
import { useAuth } from "../context/AuthContext"
import { useCharityStore } from "../store/useCharityStore"

function MyDonations() {
  const { user } = useAuth()

  // Live: status badges update the moment an NGO claims or a volunteer picks up
  const allDonations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)
  const error = useCharityStore((state) => state.error)

  const donations = allDonations.filter(
    (donation) => donation.donorId === user?.uid
  )

  // -----------------------------
  // Loading
  // -----------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">

          <p className="text-center text-gray-500">
            Loading your donations...
          </p>

        </div>
      </main>
    )
  }

  // -----------------------------
  // Page
  // -----------------------------

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">

      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div>

          <p className="text-sm font-semibold uppercase tracking-widest">
            Your Contributions
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            My Donations
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            View and track the food you have shared
            with your community.
          </p>

        </div>

        {/* Error */}

        {error && (
          <div className="mt-8 rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* No Donations */}

        {!error && donations.length === 0 && (
          <div className="mt-12 rounded-3xl border bg-white px-6 py-16 text-center">

            <h2 className="text-2xl font-bold">
              You haven't donated any food yet.
            </h2>

            <p className="mt-3 text-gray-500">
              Your donated food will appear here.
            </p>

          </div>
        )}

        {/* Donations */}

        {donations.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {donations.map((donation) => (
              <div
                key={donation.id}
                className="overflow-hidden rounded-3xl border bg-white"
              >

                {/* Image */}

                <img
                  src={donation.image}
                  alt={donation.title}
                  className="h-52 w-full object-cover"
                />

                {/* Content */}

                <div className="p-6">

                  <div className="flex items-start justify-between gap-4">

                    <h2 className="text-xl font-bold">
                      {donation.title}
                    </h2>

                    {/* Status */}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        donation.status ===
                        "available"
                          ? "bg-green-100 text-green-700"
                          : donation.status ===
                            "claimed"
                          ? "bg-yellow-100 text-yellow-700"
                          : donation.status ===
                            "picked-up"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {donation.status ===
                        "picked-up"
                        ? "Picked Up"
                        : donation.status
                            .charAt(0)
                            .toUpperCase() +
                          donation.status.slice(1)}
                    </span>

                  </div>

                  {/* Description */}

                  <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                    {donation.description}
                  </p>

                  {/* Details */}

                  <div className="mt-5 space-y-2 text-sm">

                    <p>
                      <span className="font-semibold">
                        Meals:
                      </span>{" "}
                      {donation.quantity}
                    </p>

                    <p>
                      <span className="font-semibold">
                        Food Type:
                      </span>{" "}
                      {donation.foodType}
                    </p>

                    <p>
                      <span className="font-semibold">
                        Location:
                      </span>{" "}
                      {donation.location}
                    </p>

                    <p>
                      <span className="font-semibold">
                        Pickup Before:
                      </span>{" "}
                      {new Date(
                        donation.pickupBefore
                      ).toLocaleString()}
                    </p>

                    {donation.rescuedByName && (
                      <p>
                        <span className="font-semibold">
                          Claimed by:
                        </span>{" "}
                        {donation.rescuedByName}
                      </p>
                    )}

                    {donation.volunteerName && (
                      <p>
                        <span className="font-semibold">
                          Volunteer:
                        </span>{" "}
                        {donation.volunteerName}
                      </p>
                    )}

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </main>
  )
}

export default MyDonations
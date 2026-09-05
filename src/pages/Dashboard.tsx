import { useAuth } from "../context/AuthContext"
import {
  CheckCircle,
  Clock,
  Package,
  Utensils,
} from "lucide-react"

import { useCharityStore } from "../store/useCharityStore"

function Dashboard() {
  const { user } = useAuth()
  const donations = useCharityStore(
    (state) => state.donations
  )

  // -----------------------------
  // Statistics
  // -----------------------------

  const totalDonations = donations.length

  const availableDonations = donations.filter(
    (donation) => donation.status === "available"
  ).length

  const claimedDonations = donations.filter(
    (donation) => donation.status === "claimed"
  ).length

  const pickedUpDonations = donations.filter(
    (donation) => donation.status === "picked-up"
  ).length

  const completedDonations = donations.filter(
    (donation) => donation.status === "completed"
  )

  const completedCount = completedDonations.length

  // Total meals from completed rescues
  const mealsRescued = completedDonations.reduce(
    (total, donation) =>
      total + donation.quantity,
    0
  )

  // -----------------------------
  // Achievement
  // -----------------------------

  let achievement = "🌱 Getting Started"
  let achievementMessage =
    "Start your first food rescue."

  if (completedCount >= 11) {
    achievement = "🏆 Community Hero"
    achievementMessage =
      "You're making an incredible difference!"
  } else if (completedCount >= 6) {
    achievement = "🌍 Food Rescue Champion"
    achievementMessage =
      "You're becoming a powerful force for food rescue."
  } else if (completedCount >= 3) {
    achievement = "🤝 Community Helper"
    achievementMessage =
      "You're helping reduce food waste in your community."
  }

  // -----------------------------
  // Recent Rescue Activity
  // -----------------------------

  const recentRescues = donations
    .filter(
      (donation) =>
        donation.status !== "available"
    )
    .slice(-5)
    .reverse()

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="text-sm font-semibold uppercase tracking-widest">
            Your Impact
          </p>

         <h1 className="mt-4 text-4xl font-bold md:text-5xl">
  Welcome back, {user?.displayName || "User"} 👋
</h1>

<p className="mt-3 text-sm text-gray-500">
  {user?.email}
</p>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            See how your community food rescue activity
            is making an impact.
          </p>

        </div>
      </section>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        {/* Statistics */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total */}
          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Total Donations
              </p>

              <Package className="h-5 w-5 text-gray-400" />

            </div>

            <h2 className="mt-3 text-4xl font-bold">
              {totalDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Food donations listed
            </p>

          </div>

          {/* Available */}
          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Available Food
              </p>

              <Utensils className="h-5 w-5 text-gray-400" />

            </div>

            <h2 className="mt-3 text-4xl font-bold">
              {availableDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Waiting to be rescued
            </p>

          </div>

          {/* Active */}
          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Active Rescues
              </p>

              <Clock className="h-5 w-5 text-gray-400" />

            </div>

            <h2 className="mt-3 text-4xl font-bold">
              {claimedDonations + pickedUpDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Claimed or picked up
            </p>

          </div>

          {/* Completed */}
          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Completed
              </p>

              <CheckCircle className="h-5 w-5 text-gray-400" />

            </div>

            <h2 className="mt-3 text-4xl font-bold">
              {completedCount}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Successful rescues
            </p>

          </div>

        </div>

        {/* Community Impact */}
        <div className="mt-6 rounded-3xl border bg-black p-8 text-white">

          <p className="text-sm font-semibold uppercase tracking-widest text-gray-300">
            Community Impact
          </p>

          <h2 className="mt-4 text-5xl font-bold">
            {mealsRescued}
          </h2>

          <p className="mt-2 text-lg text-gray-300">
            meals successfully rescued
          </p>

        </div>

        {/* Achievement */}
        <div className="mt-6 rounded-3xl border bg-white p-8">

          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Your Achievement
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            {achievement}
          </h2>

          <p className="mt-3 text-gray-600">
            {achievementMessage}
          </p>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100">

            <div
              className="h-full rounded-full bg-black transition-all"
              style={{
                width: `${Math.min(
                  (completedCount / 11) * 100,
                  100
                )}%`,
              }}
            />

          </div>

          <p className="mt-3 text-sm text-gray-500">
            {completedCount} completed rescue
            {completedCount !== 1 ? "s" : ""}
          </p>

        </div>

        {/* Recent Rescue Activity */}
        <div className="mt-6 rounded-3xl border bg-white p-8">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                Activity
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Recent Rescue Activity
              </h2>

            </div>

            <span className="text-2xl">
              🍱
            </span>

          </div>

          {recentRescues.length === 0 ? (

            <div className="mt-8 rounded-2xl bg-gray-50 p-8 text-center">

              <p className="text-gray-500">
                No rescue activity yet.
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Claim food to start your rescue journey.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {recentRescues.map((donation) => (

                <div
                  key={donation.id}
                  className="flex flex-col gap-4 rounded-2xl
                  border p-5 sm:flex-row sm:items-center
                  sm:justify-between"
                >

                  {/* Food information */}
                  <div>

                    <h3 className="font-semibold">
                      {donation.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      📍 {donation.location}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {donation.quantity} meals
                    </p>

                  </div>

                  {/* Status */}
                  <span
                    className={`w-fit rounded-full px-3 py-1
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

              ))}

            </div>

          )}

        </div>

      </section>
    </main>
  )
}

export default Dashboard
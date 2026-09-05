import {
  Package,
  CheckCircle,
  Clock,
  Utensils,
} from "lucide-react"

import { useCharityStore } from "../store/useCharityStore"

function Admin() {
  const donations = useCharityStore(
    (state) => state.donations
  )

  const totalDonations = donations.length

  const availableDonations = donations.filter(
    (donation) => donation.status === "available"
  ).length

  const claimedDonations = donations.filter(
    (donation) => donation.status === "claimed"
  ).length

  const completedDonations = donations.filter(
    (donation) => donation.status === "completed"
  ).length

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="text-sm font-semibold uppercase tracking-widest">
            Administration
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Admin Dashboard
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Monitor food donations and rescue activity
            across the SharePlate community.
          </p>

        </div>
      </section>

      {/* Statistics */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total */}
          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-gray-500">
                Total Donations
              </p>

              <Package className="h-5 w-5" />

            </div>

            <h2 className="mt-4 text-4xl font-bold">
              {totalDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              All food donations
            </p>

          </div>

          {/* Available */}
          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-gray-500">
                Available
              </p>

              <Utensils className="h-5 w-5" />

            </div>

            <h2 className="mt-4 text-4xl font-bold">
              {availableDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Waiting for rescue
            </p>

          </div>

          {/* Claimed */}
          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-gray-500">
                Claimed
              </p>

              <Clock className="h-5 w-5" />

            </div>

            <h2 className="mt-4 text-4xl font-bold">
              {claimedDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Active rescues
            </p>

          </div>

          {/* Completed */}
          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-gray-500">
                Completed
              </p>

              <CheckCircle className="h-5 w-5" />

            </div>

            <h2 className="mt-4 text-4xl font-bold">
              {completedDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Successful rescues
            </p>

          </div>

        </div>

        {/* Donations Table */}
        <div className="mt-10 rounded-3xl border bg-white p-6 md:p-8">

          <div className="mb-6">

            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              Management
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              All Food Donations
            </h2>

          </div>

          {donations.length === 0 ? (

            <div className="rounded-2xl bg-gray-50 p-10 text-center">

              <p className="text-gray-500">
                No food donations available.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {donations.map((donation) => (

                <div
                  key={donation.id}
                  className="flex flex-col gap-4 rounded-2xl
                  border p-5 md:flex-row md:items-center
                  md:justify-between"
                >

                  {/* Donation Info */}
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
                  <div>

                    <span
                      className={`inline-block rounded-full
                      px-4 py-2 text-xs font-semibold ${
                        donation.status === "available"
                          ? "bg-green-100 text-green-700"
                          : donation.status === "claimed"
                            ? "bg-yellow-100 text-yellow-700"
                            : donation.status === "picked-up"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {donation.status === "available"
                        ? "Available"
                        : donation.status === "claimed"
                          ? "Claimed"
                          : donation.status === "picked-up"
                            ? "Picked Up"
                            : "Completed"}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

    </main>
  )
}

export default Admin
import { useCharityStore } from "../store/useCharityStore"

function MyRescues() {
  const donations = useCharityStore((state) => state.donations)

  const claimedDonations = donations.filter(
    (donation) => donation.status === "claimed"
  )

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">

        <p className="text-sm font-semibold uppercase tracking-widest">
          Volunteer
        </p>

        <h1 className="mt-4 text-4xl font-bold md:text-5xl">
          My Rescues
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-gray-600">
          Food donations you have claimed and helped rescue.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {claimedDonations.length > 0 ? (
            claimedDonations.map((donation) => (
              <div
                key={donation.id}
                className="overflow-hidden rounded-3xl border bg-white"
              >
                <img
                  src={donation.image}
                  alt={donation.title}
                  className="h-56 w-full object-cover"
                />

                <div className="p-6">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Rescued
                  </span>

                  <h2 className="mt-4 text-xl font-bold">
                    {donation.title}
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">
                    {donation.location}
                  </p>

                  <p className="mt-3 text-sm text-gray-500">
                    {donation.quantity} meals rescued
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border bg-white px-6 py-16 text-center md:col-span-2 lg:col-span-3">
              <h2 className="text-xl font-bold">
                No rescues yet
              </h2>

              <p className="mt-2 text-gray-500">
                Claim a food donation to see it here.
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}

export default MyRescues
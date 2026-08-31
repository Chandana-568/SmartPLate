import { useCharityStore } from "../store/useCharityStore"

function Food() {
  const donations = useCharityStore((state) => state.donations)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Available Food
      </h1>

      <div className="mt-6">
        {donations.map((donation) => (
          <div key={donation.id} className="mb-4">
            <h2 className="text-xl font-semibold">
              {donation.title}
            </h2>

            <p>{donation.location}</p>
            <p>{donation.quantity} meals</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Food
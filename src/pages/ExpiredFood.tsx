import { TimerOff } from "lucide-react"
import { Link } from "react-router-dom"

import FoodCard from "../components/FoodCard"
import { useNow } from "../hooks/useNow"
import { useCharityStore } from "../store/useCharityStore"
import { isExpired } from "../utils/donationStatus"

// Food whose pickup timer ran out before anyone claimed it. It moves here
// from Find Food automatically, the moment its countdown reaches zero.
function ExpiredFood() {
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)
  const now = useNow()

  const expired = donations
    .filter((donation) => isExpired(donation, now))
    // Most recently expired first
    .sort((a, b) => new Date(b.pickupBefore).getTime() - new Date(a.pickupBefore).getTime())

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
            <TimerOff className="h-4 w-4" /> Expired
          </p>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">Expired food</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Food whose pickup time ran out before anyone claimed it. It's no longer offered to
            people, and it moves here automatically from Find Food.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : expired.length === 0 ? (
          <div className="rounded-3xl border bg-white px-6 py-16 text-center">
            <p className="text-3xl">🎉</p>
            <h2 className="mt-4 text-2xl font-bold">No expired food</h2>
            <p className="mt-2 text-gray-500">Every listing was claimed in time.</p>
            <Link
              to="/food"
              className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              Find Food
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-gray-500">
              {expired.length} expired listing{expired.length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-6 opacity-90 md:grid-cols-2 lg:grid-cols-3">
              {expired.map((donation) => (
                <FoodCard key={donation.id} donation={donation} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default ExpiredFood

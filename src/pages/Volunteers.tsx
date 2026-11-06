import { ArrowRight, Bike, KeyRound, MapPin, PackageCheck } from "lucide-react"
import { Link } from "react-router-dom"

import { useAuth } from "../context/auth"
import { useCharityStore } from "../store/useCharityStore"
import { computeImpact, formatNumber } from "../utils/impact"

const STEPS = [
  {
    icon: Bike,
    title: "Accept a task",
    text: "When an NGO claims food, a delivery task appears for nearby volunteers.",
  },
  {
    icon: MapPin,
    title: "Collect from the donor",
    text: "Get directions in one tap. The donor gives you a 4-digit pickup code.",
  },
  {
    icon: KeyRound,
    title: "Verify with the code",
    text: "Enter the code to prove a safe handover. No code, no pickup.",
  },
  {
    icon: PackageCheck,
    title: "Deliver to the NGO",
    text: "Drop the food off and mark it delivered. The impact counter goes up live.",
  },
]

function Volunteers() {
  const { user, role } = useAuth()
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)

  const waiting = donations.filter(
    (d) => d.status === "claimed" && !d.volunteerId
  ).length
  const impact = computeImpact(donations)

  const cta =
    role === "volunteer"
      ? { to: "/my-rescues", label: "See open tasks" }
      : user
        ? null
        : { to: "/signup", label: "Become a volunteer" }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Volunteer</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold md:text-6xl">
            Be the bridge between surplus food and an empty plate.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-600">
            Donors have the food. NGOs have the need. Volunteers make the delivery happen, in about 30 minutes.
          </p>

          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4">
            <div className="rounded-3xl border bg-gray-50 p-6">
              <p className="text-4xl font-bold">{loading ? "—" : waiting}</p>
              <p className="mt-1 text-sm text-gray-500">
                deliveries waiting for a volunteer right now
              </p>
            </div>
            <div className="rounded-3xl border bg-gray-50 p-6">
              <p className="text-4xl font-bold">
                {loading ? "—" : formatNumber(impact.meals)}
              </p>
              <p className="mt-1 text-sm text-gray-500">meals delivered so far</p>
            </div>
          </div>

          {cta && (
            <Link
              to={cta.to}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand-700 px-7 py-4 font-semibold text-white transition hover:bg-brand-800"
            >
              {cta.label} <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold">How a delivery works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="rounded-3xl border bg-white shadow-card p-6">
              <div className="flex items-center justify-between">
                <Icon className="h-8 w-8" />
                <span className="text-sm font-semibold text-gray-400">0{index + 1}</span>
              </div>
              <h3 className="mt-6 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Volunteers

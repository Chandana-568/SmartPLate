import { Link } from "react-router-dom"

import ImpactStats from "../components/ImpactStats"
import HowItWorks from "../components/HowItWorks"
import FeaturedFood from "../components/FeaturedFood"
import ImpactCTA from "../components/ImpactCTA"

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main>

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid items-center gap-12 md:grid-cols-2">

            <div>

              <p className="mb-4 text-sm font-semibold uppercase tracking-wider">
                Food Rescue Platform
              </p>

              <h1 className="text-5xl font-bold leading-tight md:text-6xl">
                Good Food Should Never Go to Waste.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
                SharePlate connects surplus food with volunteers
                and organizations that can get it to people who need it.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">

                {/* Find Food */}
                <Link
                  to="/food"
                  className="rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
                >
                  Find Food
                </Link>

                {/* Donate Surplus */}
                <Link
                  to="/donate"
                  className="rounded-full border px-6 py-3 font-semibold transition hover:bg-gray-50"
                >
                  Donate Surplus
                </Link>

              </div>
            </div>

            {/* Hero Image */}
            <div className="overflow-hidden rounded-3xl">

              <img
                src="https://images.unsplash.com/photo-1593113598332-cd288d649433"
                alt="Volunteers distributing food"
                className="h-[450px] w-full object-cover"
              />

            </div>

          </div>
        </section>

        {/* Impact Stats */}
        <ImpactStats />

        {/* How It Works */}
        <HowItWorks />

        {/* Featured Food */}
        <FeaturedFood />

        {/* Impact CTA */}
        <ImpactCTA />

      </main>
    </div>
  )
}

export default Home
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

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-full bg-black px-6 py-3 font-semibold text-white">
                  Find Food
                </button>

                <button className="rounded-full border px-6 py-3 font-semibold">
                  Donate Surplus
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl">
              <img
                src="https://images.unsplash.com/photo-1593113598332-cd288d649433"
                alt="Volunteers distributing food"
                className="h-[450px] w-full object-cover"
              />
            </div>

          </div>
        </section>

        {/* Impact Stats will come here */}
        <ImpactStats />
        <HowItWorks />
        <FeaturedFood /> 
        <ImpactCTA />   
      </main>
    </div>
  )
}

export default Home

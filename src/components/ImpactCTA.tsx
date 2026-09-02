import { ArrowRight, Heart } from "lucide-react"
import { Link } from "react-router-dom"

function ImpactCTA() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-black px-8 py-16 text-white md:px-16">

          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Heart className="h-6 w-6" />
            </div>

            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              One meal rescued is one less meal wasted.
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-300">
              Whether you have surplus food or a few hours to volunteer,
              your small action can create a meaningful impact.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/donate"
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
              >
                Donate Food
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/volunteers"
                className="rounded-full border border-white/30 px-6 py-3 font-semibold transition hover:bg-white/10"
              >
                Become a Volunteer
              </Link>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 right-20 h-80 w-80 rounded-full border border-white/10" />

        </div>
      </div>
    </section>
  )
}

export default ImpactCTA
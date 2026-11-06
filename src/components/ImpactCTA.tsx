import { ArrowRight, Heart } from "lucide-react"
import { Link } from "react-router-dom"

function ImpactCTA() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 px-8 py-16 text-white shadow-2xl shadow-brand-900/20 md:px-16">

          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Heart className="h-6 w-6" />
            </div>

            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              One meal rescued is one less meal wasted.
            </h2>

            <p className="mt-6 text-lg leading-8 text-brand-100">
              Whether you have surplus food or a few hours to volunteer,
              your small action can create a meaningful impact.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/donate"
                className="flex items-center gap-2 rounded-full bg-saffron-400 px-6 py-3 font-semibold text-brand-950 transition hover:bg-saffron-300"
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
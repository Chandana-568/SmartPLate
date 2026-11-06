import { ArrowRight, Leaf, ShieldCheck, Timer } from "lucide-react"
import { Link } from "react-router-dom"

import FeaturedFood from "../components/FeaturedFood"
import HowItWorks from "../components/HowItWorks"
import ImpactCTA from "../components/ImpactCTA"
import ImpactStats from "../components/ImpactStats"

// Real photo of an Indian meal (Unsplash)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1742281257687-092746ad6021?w=1200&q=75&fm=jpg&fit=crop"

function Home() {
  return (
    <div className="min-h-screen">
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Soft colour wash */}
          <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-24 h-[24rem] w-[24rem] rounded-full bg-saffron-100/80 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-brand-700 sm:text-sm">
                <Leaf className="h-4 w-4" /> AI-powered food rescue · Smart waste management
              </p>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] sm:text-5xl md:text-6xl">
                Good food should{" "}
                <span className="relative text-brand-700 sm:whitespace-nowrap">
                  never go to waste
                  <svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full" aria-hidden="true">
                    <path d="M2 9c60-6 130-8 296-4" stroke="#ffab2e" strokeWidth="5" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                .
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
                SharePlate connects surplus food from homes, hostels, caterers and events with NGOs and
                volunteers nearby, and sends anything that expires to poultry, compost and biogas units
                instead of the bin.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-700/20 transition hover:-translate-y-0.5 hover:bg-brand-800"
                >
                  Donate surplus food <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/food"
                  className="rounded-full border border-gray-300 bg-white px-7 py-3.5 font-semibold transition hover:border-brand-500 hover:text-brand-700"
                >
                  Find food near you
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-600" /> AI checks every photo
                </span>
                <span className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-saffron-500" /> Max 5-hour pickup window
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">♻️</span> Zero food to landfill
                </span>
              </div>
            </div>

            {/* Hero image with live-style cards */}
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] shadow-2xl shadow-brand-900/15 ring-8 ring-white">
                <img src={HERO_IMAGE} alt="An Indian thali with rice, dal, curries and roti" className="h-[460px] w-full object-cover" />
              </div>

              <div className="absolute -left-4 top-10 hidden rounded-2xl bg-white px-4 py-3 shadow-card sm:block">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Just claimed</p>
                <p className="mt-0.5 font-bold">🍱 40 meals · Hope Ashram</p>
              </div>
              <div className="absolute -bottom-5 right-6 hidden rounded-2xl bg-white px-4 py-3 shadow-card sm:block">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Expired food</p>
                <p className="mt-0.5 font-bold">🐔 12 kg to a poultry farm</p>
              </div>
            </div>
          </div>
        </section>

        <ImpactStats />
        <HowItWorks />
        <FeaturedFood />
        <ImpactCTA />
      </main>
    </div>
  )
}

export default Home

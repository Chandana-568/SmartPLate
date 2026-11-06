import { Cloud, HandPlatter, Scale, Store } from "lucide-react"

import { useCharityStore } from "../store/useCharityStore"
import { computeImpact, formatNumber } from "../utils/impact"

// Live impact numbers, calculated from delivered donations in Firestore
function ImpactStats() {
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)

  const impact = computeImpact(donations)

  const stats = [
    { value: formatNumber(impact.meals), label: "Meals rescued", icon: HandPlatter, tint: "bg-brand-50 text-brand-700" },
    { value: `${formatNumber(impact.kgSaved + impact.recycledKg)} kg`, label: "Food kept from landfill", icon: Scale, tint: "bg-saffron-50 text-saffron-600" },
    { value: `${formatNumber(impact.co2Kg)} kg`, label: "CO₂e avoided", icon: Cloud, tint: "bg-sky-50 text-sky-700" },
    { value: formatNumber(impact.donors), label: "Food donors", icon: Store, tint: "bg-rose-50 text-rose-700" },
  ]

  return (
    <section className="mx-auto max-w-7xl px-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-3xl border bg-white p-6 shadow-card">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.tint}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-3xl font-extrabold tabular-nums md:text-4xl">{loading ? "—" : stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">
        Live from SharePlate deliveries · 1 meal ≈ 0.4 kg food ≈ 1 kg CO₂e
      </p>
    </section>
  )
}

export default ImpactStats

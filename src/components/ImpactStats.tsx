import { useCharityStore } from "../store/useCharityStore"
import { computeImpact, formatNumber } from "../utils/impact"

// Live impact numbers, calculated from delivered donations in Firestore
function ImpactStats() {
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)

  const impact = computeImpact(donations)

  const stats = [
    { value: formatNumber(impact.meals), label: "Meals Rescued" },
    { value: `${formatNumber(impact.kgSaved)} kg`, label: "Food Saved from Waste" },
    { value: `${formatNumber(impact.co2Kg)} kg`, label: "CO₂ Emissions Avoided" },
    { value: formatNumber(impact.donors), label: "Food Donors" },
  ]

  return (
    <section className="border-y">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="px-6 py-10 text-center"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              {loading ? "—" : stat.value}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
      <p className="pb-4 text-center text-xs text-gray-400">
        Live from SharePlate deliveries · 1 meal ≈ 0.4 kg food ≈ 1 kg CO₂e
      </p>
    </section>
  )
}

export default ImpactStats

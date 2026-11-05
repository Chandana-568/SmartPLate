import { useCharityStore } from "../store/useCharityStore"
import { computeImpact, formatNumber } from "../utils/impact"

// Live impact numbers, calculated from delivered donations in Firestore
function ImpactStats() {
  const donations = useCharityStore((state) => state.donations)
  const loading = useCharityStore((state) => state.loading)

  const impact = computeImpact(donations)

  const dest = impact.destinations
  const stats = [
    { value: formatNumber(impact.meals), label: "Meals Rescued" },
    { value: `${formatNumber(dest.diverted)} kg`, label: "Given a Second Life (animals + compost)" },
    { value: `${formatNumber(impact.co2Kg)} kg`, label: "CO₂e Avoided (est.)" },
    { value: `${formatNumber(dest.landfill)} kg`, label: "Sent to Landfill" },
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
        Live from SharePlate · 1 meal ≈ 0.4 kg · estimates: 2.5 kg CO₂e per kg eaten, 0.5 per kg fed to animals or composted
      </p>
    </section>
  )
}

export default ImpactStats

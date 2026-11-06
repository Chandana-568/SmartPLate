import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { FoodDonation } from "../types"
import { isExpired } from "../utils/donationStatus"
import { computeImpact, formatNumber, KG_PER_MEAL } from "../utils/impact"

// One validated series color (passes contrast + lightness checks on white);
// every chart here is single-series, so names live on the axis, not in color.
const SERIES = "#2a78d6"
const GRID = "#e7e5e4"
const AXIS_TEXT = { fill: "#52514e", fontSize: 12 }

const DAY = 24 * 60 * 60 * 1000

function dayKey(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function mealsPerDay(donations: FoodDonation[], days = 14, now = Date.now()) {
  const buckets = new Map<string, { label: string; meals: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const ms = now - i * DAY
    buckets.set(dayKey(ms), {
      label: new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      meals: 0,
    })
  }
  for (const d of donations) {
    if (d.status !== "completed" || !d.completedAt) continue
    const bucket = buckets.get(dayKey(d.completedAt))
    if (bucket) bucket.meals += Number(d.quantity) || 0
  }
  return [...buckets.values()]
}

function topDonors(donations: FoodDonation[], limit = 5) {
  const totals = new Map<string, number>()
  for (const d of donations) {
    if (d.status !== "completed") continue
    totals.set(d.donorName, (totals.get(d.donorName) ?? 0) + (Number(d.quantity) || 0))
  }
  return [...totals.entries()]
    .map(([name, meals]) => ({ name, meals }))
    .sort((a, b) => b.meals - a.meals)
    .slice(0, limit)
}

function statusCounts(donations: FoodDonation[]) {
  const count = (fn: (d: FoodDonation) => boolean) => donations.filter(fn).length
  return [
    { name: "Under review", count: count((d) => d.status === "under_review") },
    { name: "Available", count: count((d) => d.status === "available" && !isExpired(d)) },
    { name: "Expired", count: count((d) => isExpired(d)) },
    { name: "Claimed", count: count((d) => d.status === "claimed") },
    { name: "On the way", count: count((d) => d.status === "picked-up") },
    { name: "Delivered", count: count((d) => d.status === "completed") },
  ]
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-white shadow-card p-6">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e7e5e4",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  fontSize: 13,
}

function ImpactCharts({ donations }: { donations: FoodDonation[] }) {
  const impact = computeImpact(donations)
  const daily = mealsPerDay(donations)
  const donors = topDonors(donations)
  const statuses = statusCounts(donations)

  const tiles = [
    { label: "Meals delivered", value: formatNumber(impact.meals), note: `${impact.rescues} completed rescues` },
    { label: "Food saved from waste", value: `${formatNumber(impact.kgSaved)} kg`, note: `≈ ${KG_PER_MEAL} kg per meal · +${formatNumber(impact.recycledKg)} kg expired food recycled` },
    { label: "CO₂e avoided", value: `${formatNumber(impact.co2Kg)} kg`, note: "≈ 2.5 kg CO₂e per kg of food" },
    { label: "NGOs served", value: formatNumber(impact.ngos), note: `${impact.donors} donors on the platform` },
  ]

  return (
    <section className="mt-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Impact</p>
      <h2 className="mt-2 text-2xl font-bold">Food rescued, live</h2>

      {/* Hero numbers */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-3xl border bg-white shadow-card p-6">
            <p className="text-sm font-semibold text-gray-500">{tile.label}</p>
            <p className="mt-3 text-4xl font-bold tabular-nums">{tile.value}</p>
            <p className="mt-2 text-xs text-gray-500">{tile.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Meals per day */}
        <div className="lg:col-span-2">
          <ChartCard title="Meals delivered per day" subtitle="Last 14 days, by delivery date">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap={4}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="label" tick={AXIS_TEXT} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis tick={AXIS_TEXT} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${value} meals`, "Delivered"]}
                  />
                  <Bar dataKey="meals" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-3 text-sm text-gray-600">
              <summary className="cursor-pointer font-semibold">View as table</summary>
              <table className="mt-2 w-full text-left">
                <thead>
                  <tr className="text-gray-500"><th className="py-1">Day</th><th className="py-1 text-right">Meals</th></tr>
                </thead>
                <tbody>
                  {daily.map((row) => (
                    <tr key={row.label} className="border-t"><td className="py-1">{row.label}</td><td className="py-1 text-right tabular-nums">{row.meals}</td></tr>
                  ))}
                </tbody>
              </table>
            </details>
          </ChartCard>
        </div>

        {/* Status */}
        <ChartCard title="Donations by status" subtitle="Right now, across the platform">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statuses} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap={6}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={AXIS_TEXT} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={104} tick={AXIS_TEXT} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={tooltipStyle} formatter={(value) => [value, "Donations"]} />
                <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: "right", fill: "#52514e", fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Top donors */}
      <div className="mt-6">
        <ChartCard title="Top donors" subtitle="Meals delivered to NGOs">
          {donors.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No deliveries yet.</p>
          ) : (
            <div style={{ height: Math.max(120, donors.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={donors} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }} barCategoryGap={8}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={160} tick={AXIS_TEXT} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={tooltipStyle} formatter={(value) => [`${value} meals`, "Delivered"]} />
                  <Bar dataKey="meals" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={24} label={{ position: "right", fill: "#52514e", fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </section>
  )
}

export default ImpactCharts

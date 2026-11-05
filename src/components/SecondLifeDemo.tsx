import { Check, Recycle } from "lucide-react"

import { useNow } from "../hooks/useNow"
import type { FoodDonation } from "../types"
import { formatTime } from "../utils/donationStatus"
import { ROUTE_LABEL, simulateSecondLife } from "../utils/secondLife"

// Shown once food expires before pickup: it automatically goes to the
// nearest poultry farm, goshala or compost unit instead of a bin.
// Simulated for the demo (see utils/secondLife.ts).
function SecondLifeDemo({ donation, compact = false }: { donation: FoodDonation; compact?: boolean }) {
  const now = useNow()
  const sim = simulateSecondLife(donation, now)
  if (!sim) return null

  const { place } = sim
  const steps = [
    { done: true, title: "Expired: no longer offered to people", detail: formatTime(sim.expiredAt) },
    { done: true, title: "🤖 AI sorted it", detail: sim.reason },
    {
      done: true,
      title: `${place.emoji} Routed to ${place.name}`,
      detail: `${ROUTE_LABEL[sim.route]}${sim.km != null ? ` · ${sim.km.toFixed(1)} km away` : ""}`,
    },
    { done: sim.stage !== "routed", title: "🚚 Collected", detail: formatTime(sim.collectingAt) },
    {
      done: sim.stage === "received",
      title: `✅ Received: ${sim.kg} kg kept out of landfill`,
      detail: formatTime(sim.receivedAt),
    },
  ]
  const next = steps.findIndex((s) => !s.done)

  if (compact) {
    const current = steps[next === -1 ? steps.length - 1 : next - 1]
    return (
      <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">
        <p className="flex items-center gap-2 font-semibold">
          <Recycle className="h-4 w-4" /> Second life: {place.emoji} {ROUTE_LABEL[sim.route].toLowerCase()} at {place.name}
        </p>
        <p className="mt-1 text-xs text-green-800">
          {current.title} · <span className="opacity-70">Demo: partner network simulated</span>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-bold text-green-900">
          <Recycle className="h-5 w-5" /> Second life, not the bin
        </p>
        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-green-800">
          Demo: partner network simulated
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                step.done ? "border-green-700 bg-green-700 text-white" : index === next ? "border-green-700 bg-white" : "border-green-200 bg-white"
              }`}
            >
              {step.done && <Check className="h-3.5 w-3.5" />}
            </span>
            <span className={step.done ? "text-green-950" : "text-green-900/50"}>
              <span className="block text-sm font-semibold">
                {step.title}
                {index === next && (
                  <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Next</span>
                )}
              </span>
              <span className="block text-xs">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default SecondLifeDemo

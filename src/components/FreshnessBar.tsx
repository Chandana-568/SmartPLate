import { AlertTriangle, CircleCheck, Clock, XCircle } from "lucide-react"

import { useNow } from "../hooks/useNow"
import type { FoodDonation } from "../types"
import { getFreshness, type FreshnessStage } from "../utils/freshness"

// Status palette (fixed): good → warning → serious → critical.
// Each stage also has an icon + label, so colour never carries meaning alone.
const STAGE_STYLE: Record<FreshnessStage, { bar: string; text: string; icon: typeof Clock }> = {
  fresh: { bar: "#0ca30c", text: "text-green-800", icon: CircleCheck },
  soon: { bar: "#fab219", text: "text-yellow-800", icon: Clock },
  urgent: { bar: "#d03b3b", text: "text-red-700", icon: AlertTriangle },
  expired: { bar: "#9ca3af", text: "text-gray-600", icon: XCircle },
}

interface FreshnessBarProps {
  donation: Pick<FoodDonation, "pickupBefore" | "createdAt" | "status">
  size?: "sm" | "md"
}

// Live "safe until" countdown: green while fresh, amber, then red, then expired
function FreshnessBar({ donation, size = "sm" }: FreshnessBarProps) {
  const now = useNow()
  const freshness = getFreshness(donation, now)

  // Once food reached the NGO, freshness no longer matters
  if (!freshness || donation.status === "completed") return null

  const style = STAGE_STYLE[freshness.stage]
  const Icon = style.icon
  const expired = freshness.stage === "expired"

  return (
    <div>
      <div className={`flex items-center justify-between gap-2 ${size === "md" ? "text-sm" : "text-xs"}`}>
        <span className={`flex items-center gap-1 font-semibold ${style.text}`}>
          <Icon className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
          {freshness.label}
        </span>
        <span className="tabular-nums text-gray-600">{freshness.timeLeft}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Freshness: share of safe time left"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(freshness.percentLeft)}
        aria-valuetext={`${freshness.label}, ${freshness.timeLeft}`}
        className={`mt-1.5 w-full overflow-hidden rounded-full bg-gray-100 ${size === "md" ? "h-2.5" : "h-2"}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: expired ? "100%" : `${Math.max(4, freshness.percentLeft)}%`,
            backgroundColor: style.bar,
            opacity: expired ? 0.5 : 1,
          }}
        />
      </div>
    </div>
  )
}

export default FreshnessBar

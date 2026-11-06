import { Timer } from "lucide-react"

import { useNow } from "../hooks/useNow"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

// Live countdown to the donor's "pickup before" time.
// Green while plenty of time, amber in the last hour, red in the last
// 15 minutes, then EXPIRED.
function CountdownTimer({ pickupBefore, size = "sm" }: { pickupBefore: string; size?: "sm" | "lg" }) {
  const now = useNow()
  const end = new Date(pickupBefore).getTime()
  if (!Number.isFinite(end)) return null

  const msLeft = end - now
  const big = size === "lg"

  if (msLeft <= 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-gray-900 font-bold uppercase tracking-wide text-white ${
          big ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs"
        }`}
      >
        <Timer className={big ? "h-4 w-4" : "h-3.5 w-3.5"} /> Expired
      </span>
    )
  }

  const totalSec = Math.floor(msLeft / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const style =
    msLeft <= 15 * 60 * 1000
      ? "bg-red-100 text-red-700"
      : msLeft <= 60 * 60 * 1000
        ? "bg-yellow-100 text-yellow-800"
        : "bg-green-100 text-green-800"

  return (
    <span
      role="timer"
      aria-label={`${h} hours ${m} minutes left to pick up`}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tabular-nums ${style} ${
        big ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs"
      }`}
    >
      <Timer className={big ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {h > 0 ? `${h}h ` : ""}
      {pad(m)}m {pad(s)}s left
    </span>
  )
}

export default CountdownTimer

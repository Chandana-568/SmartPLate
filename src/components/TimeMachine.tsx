import { FastForward } from "lucide-react"
import { useState } from "react"

import { fastForward, isTicking } from "../services/timeMachine"
import type { FoodDonation } from "../types"

const MIN = 60 * 1000
const STEPS = [
  { label: "+30 min", ms: 30 * MIN },
  { label: "+1 h", ms: 60 * MIN },
  { label: "+3 h", ms: 180 * MIN },
]

// Admin-only demo control. `donations` = what to age: one listing on its
// details page, or every live listing on the Admin page.
function TimeMachine({ donations, compact = false }: { donations: FoodDonation[]; compact?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const ticking = donations.filter(isTicking)

  const run = async (ms: number, label: string) => {
    try {
      setBusy(true)
      const count = await fastForward(ticking, ms)
      setMessage(count ? `⏩ ${count} listing${count === 1 ? "" : "s"} moved ${label} into the future.` : "Nothing to fast-forward.")
    } catch (error) {
      console.error("Time machine failed:", error)
      setMessage("Couldn't fast-forward. Are you logged in as admin?")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`rounded-2xl border border-dashed border-purple-300 bg-purple-50/60 ${compact ? "p-3" : "p-4"}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-purple-900">
        <FastForward className="h-4 w-4" /> Demo time machine
        <span className="font-normal text-purple-700">
          ({ticking.length} live listing{ticking.length === 1 ? "" : "s"})
        </span>
      </p>
      {!compact && (
        <p className="mt-1 text-xs text-purple-800">
          Ages food for a live demo: freshness bars, expiry rules and second-life WhatsApp alerts all follow.
          Changes the listings' real times, so use it on demo data.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {STEPS.map(({ label, ms }) => (
          <button
            key={label}
            type="button"
            disabled={busy || ticking.length === 0}
            onClick={() => run(ms, label)}
            className="rounded-full bg-purple-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-800 disabled:bg-purple-300"
          >
            {label}
          </button>
        ))}
      </div>
      {message && <p className="mt-2 text-xs font-medium text-purple-900">{message}</p>}
    </div>
  )
}

export default TimeMachine

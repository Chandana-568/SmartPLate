import { useEffect, useRef } from "react"

import { useAuth } from "../context/auth"
import { useNow } from "../hooks/useNow"
import { notifyNgos } from "../services/notifyService"
import { useCharityStore } from "../store/useCharityStore"
import { awaitingSecondLife } from "../utils/secondLife"

const ALERT_WINDOW_MS = 2 * 60 * 60 * 1000 // matches the server

// When food expires unclaimed, ask the server to WhatsApp the nearest
// poultry / goshala / compost partners. Runs in the donor's (or an admin's)
// open app; the server re-checks the expiry and de-duplicates.
// Production: move this to a scheduled server job so it runs with no one online.
function ExpiryWatcher() {
  const { user, isAdmin } = useAuth()
  const donations = useCharityStore((state) => state.donations)
  const now = useNow(60_000)
  const alerted = useRef(new Set<string>())

  useEffect(() => {
    if (!user) return
    for (const d of donations) {
      if (alerted.current.has(d.id)) continue
      // Unclaimed, or claimed by an NGO that didn't collect it in time
      if (!awaitingSecondLife(d, now)) continue
      if (now - (d.expiresAt as number) >= ALERT_WINDOW_MS) continue
      if (d.donorId !== user.uid && d.rescuedBy !== user.uid && !isAdmin) continue
      alerted.current.add(d.id)
      notifyNgos("expired", d.id)
    }
  }, [donations, now, user, isAdmin])

  return null
}

export default ExpiryWatcher

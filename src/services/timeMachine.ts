// Demo "time machine" (admins only): makes listings older by shifting their
// real timestamps back. Because the data itself changes, the freshness bars,
// the server-side expiry rules and the WhatsApp expiry alerts all agree, so
// judges can watch food go green → amber → red → expired → second life live.
import { doc, writeBatch } from "firebase/firestore"

import { db } from "../firebase"
import type { FoodDonation } from "../types"

const TIME_FIELDS = ["createdAt", "claimedAt", "assignedAt", "pickedUpAt"] as const

function toLocalInput(ms: number) {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Listings whose freshness is still ticking
export function isTicking(d: FoodDonation) {
  return (
    typeof d.expiresAt === "number" &&
    !d.secondLife &&
    (d.status === "available" || d.status === "claimed" || d.status === "picked-up")
  )
}

export async function fastForward(donations: FoodDonation[], ms: number) {
  const targets = donations.filter(isTicking)
  if (targets.length === 0) return 0

  const batch = writeBatch(db)
  for (const d of targets) {
    const expiresAt = (d.expiresAt as number) - ms
    const update: Record<string, number | string> = {
      expiresAt,
      pickupBefore: toLocalInput(expiresAt),
    }
    for (const field of TIME_FIELDS) {
      const value = d[field]
      if (typeof value === "number") update[field] = value - ms
    }
    batch.update(doc(db, "donations", d.id), update)
  }
  await batch.commit()
  return targets.length
}

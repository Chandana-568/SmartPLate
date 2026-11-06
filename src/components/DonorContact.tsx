import { MessageSquare, Phone } from "lucide-react"
import { useEffect, useState } from "react"

import { getContact } from "../services/userService"
import type { FoodDonation } from "../types"

// Dialable number: digits only, +91 added to 10-digit Indian numbers
function dialNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 10 ? `+91${digits}` : `+${digits}`
}

// Made-up number for demo listings and donors who left their phone empty.
// Same donor name -> same number every time. The buttons never dial it:
// it could belong to a real stranger.
function demoPhone(donation: FoodDonation) {
  let hash = 7
  for (const ch of donation.donorName || donation.donorId) hash = (hash * 31 + ch.charCodeAt(0)) % 100000
  return `+91 98${String(hash % 1000).padStart(3, "0")} ${String(hash).padStart(5, "0")}`
}

// Donor name, phone number, Call and SMS for an expired listing
function DonorContact({ donation, useFor }: { donation: FoodDonation; useFor: string }) {
  const [realPhone, setRealPhone] = useState<string | null>(null)
  const [demoTapped, setDemoTapped] = useState("")

  useEffect(() => {
    if (donation.seed) return
    let active = true
    getContact(donation.donorId)
      .then((c) => active && setRealPhone(c.phone.trim()))
      .catch((error) => {
        console.error("Donor contact error:", error)
        if (active) setRealPhone("")
      })
    return () => {
      active = false
    }
  }, [donation.donorId, donation.seed])

  if (!donation.seed && realPhone === null) {
    return <p className="mt-2 text-xs text-gray-400">Loading donor contact...</p>
  }

  // Demo listings are saved under the admin account, so never show its number
  const isDemo = donation.seed || !realPhone
  const phone = isDemo ? demoPhone(donation) : realPhone!

  const sms = encodeURIComponent(
    `Hi ${donation.donorName}, I saw your expired listing "${donation.title}" on SharePlate. ` +
      `Can I collect it for ${useFor}?`
  )
  const demoClick = (what: string) => (event: React.MouseEvent) => {
    event.preventDefault()
    setDemoTapped(`Demo number: in a real listing this ${what} ${donation.donorName} directly.`)
  }
  const btn =
    "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition hover:bg-gray-50"

  return (
    <div className="mt-2 rounded-xl border px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Donor contact</p>
      <p className="mt-1 font-semibold">{donation.donorName}</p>
      <p className="flex items-center gap-1.5 text-sm text-gray-700">
        <Phone className="h-3.5 w-3.5" /> {phone}
        {isDemo && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">Demo</span>
        )}
      </p>

      <div className="mt-2 flex gap-2">
        <a href={`tel:${dialNumber(phone)}`} onClick={isDemo ? demoClick("calls") : undefined} className={btn}>
          <Phone className="h-4 w-4" /> Call
        </a>
        <a
          href={`sms:${dialNumber(phone)}?body=${sms}`}
          onClick={isDemo ? demoClick("sends an SMS to") : undefined}
          className={btn}
        >
          <MessageSquare className="h-4 w-4" /> SMS
        </a>
      </div>

      {demoTapped && <p className="mt-1.5 text-xs font-medium text-amber-700">{demoTapped}</p>}
    </div>
  )
}

export default DonorContact

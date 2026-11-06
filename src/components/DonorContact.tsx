import { Mail, MessageCircle, Phone } from "lucide-react"
import { useEffect, useState } from "react"

import { getContact } from "../services/userService"
import type { FoodDonation } from "../types"

// WhatsApp needs the number with country code, digits only (India by default)
function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 10 ? `91${digits}` : digits
}

// Made-up contact for demo listings and donors who left their phone empty.
// Same donor name -> same number every time. The buttons never dial these:
// they could belong to a real stranger.
function demoContact(donation: FoodDonation) {
  let hash = 7
  for (const ch of donation.donorName || donation.donorId) hash = (hash * 31 + ch.charCodeAt(0)) % 100000
  const slug = (donation.donorName || "donor").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")
  return {
    phone: `+91 98${String(hash % 1000).padStart(3, "0")} ${String(hash).padStart(5, "0")}`,
    email: `${slug || "donor"}@demo.shareplate.in`,
  }
}

// Call / WhatsApp / email buttons for the donor of an expired listing
function DonorContact({ donation, useFor }: { donation: FoodDonation; useFor: string }) {
  const [contact, setContact] = useState<{ phone: string; email: string } | null>(null)
  const [demoTapped, setDemoTapped] = useState("")

  useEffect(() => {
    if (donation.seed) return
    let active = true
    getContact(donation.donorId)
      .then((c) => active && setContact(c))
      .catch((error) => {
        console.error("Donor contact error:", error)
        if (active) setContact({ phone: "", email: "" })
      })
    return () => {
      active = false
    }
  }, [donation.donorId, donation.seed])

  if (!donation.seed && !contact) return <p className="mt-2 text-xs text-gray-400">Loading donor contact...</p>

  const realPhone = contact?.phone.trim() ?? ""
  const realEmail = (contact?.email || donation.donorEmail || "").trim()
  // Demo listings are saved under the admin account, so never show its contact
  const isDemo = donation.seed || (!realPhone && !realEmail)
  const { phone, email } = isDemo ? demoContact(donation) : { phone: realPhone, email: realEmail }

  const message = encodeURIComponent(
    `Hi ${donation.donorName}, I saw your expired listing "${donation.title}" on SharePlate. ` +
      `Can I collect it for ${useFor}?`
  )
  const demoClick = (what: string) => (event: React.MouseEvent) => {
    event.preventDefault()
    setDemoTapped(`Demo contact: in a real listing this ${what} ${donation.donorName} directly.`)
  }
  const btn =
    "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition hover:bg-gray-50"

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        {phone && (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} onClick={isDemo ? demoClick("calls") : undefined} className={btn}>
            <Phone className="h-4 w-4" /> Call
          </a>
        )}
        {phone && (
          <a
            href={`https://wa.me/${waNumber(phone)}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={isDemo ? demoClick("opens a WhatsApp chat with") : undefined}
            className={`${btn} border-green-300 text-green-700 hover:bg-green-50`}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        {email && (
          <a href={`mailto:${email}?subject=${encodeURIComponent(`SharePlate: ${donation.title}`)}&body=${message}`} onClick={isDemo ? demoClick("emails") : undefined} className={btn}>
            <Mail className="h-4 w-4" /> Email
          </a>
        )}
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        {isDemo && <span className="mr-1 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">Demo</span>}
        {phone}
        {phone && email && " · "}
        {email}
      </p>
      {demoTapped && <p className="mt-1 text-xs font-medium text-amber-700">{demoTapped}</p>}
    </div>
  )
}

export default DonorContact

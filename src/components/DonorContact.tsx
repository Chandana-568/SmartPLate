import { Mail, MessageCircle, Phone } from "lucide-react"
import { useEffect, useState } from "react"

import { getContact } from "../services/userService"
import type { FoodDonation } from "../types"

// WhatsApp needs the number with country code, digits only (India by default)
function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 10 ? `91${digits}` : digits
}

// Call / WhatsApp / email buttons for the donor of an expired listing
function DonorContact({ donation, useFor }: { donation: FoodDonation; useFor: string }) {
  const [contact, setContact] = useState<{ phone: string; email: string } | null>(null)

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

  if (donation.seed) {
    return <p className="mt-2 text-xs text-gray-500">Demo listing: real donors' phone and email show here.</p>
  }
  if (!contact) return <p className="mt-2 text-xs text-gray-400">Loading donor contact...</p>

  const phone = contact.phone.trim()
  const email = (contact.email || donation.donorEmail || "").trim()
  if (!phone && !email) {
    return <p className="mt-2 text-xs text-gray-500">This donor hasn't added a phone number or email.</p>
  }

  const message = encodeURIComponent(
    `Hi ${donation.donorName}, I saw your expired listing "${donation.title}" on SharePlate. ` +
      `Can I collect it for ${useFor}?`
  )
  const btn =
    "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition hover:bg-gray-50"

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        {phone && (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={btn}>
            <Phone className="h-4 w-4" /> Call
          </a>
        )}
        {phone && (
          <a
            href={`https://wa.me/${waNumber(phone)}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} border-green-300 text-green-700 hover:bg-green-50`}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        {email && (
          <a href={`mailto:${email}?subject=${encodeURIComponent(`SharePlate: ${donation.title}`)}&body=${message}`} className={btn}>
            <Mail className="h-4 w-4" /> Email
          </a>
        )}
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        {phone}
        {phone && email && " · "}
        {email}
      </p>
    </div>
  )
}

export default DonorContact

import { MessageSquare, Phone } from "lucide-react"
import { useEffect, useState } from "react"

import { getContact } from "../services/userService"

// Dialable number: digits only, +91 added to 10-digit Indian numbers
function dialNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 10 ? `+91${digits}` : `+${digits}`
}

// Made-up number for demo listings. Same name -> same number every time.
// The buttons never dial it: it could belong to a real stranger.
function demoPhone(name: string) {
  let hash = 7
  for (const ch of name || "donor") hash = (hash * 31 + ch.charCodeAt(0)) % 100000
  return `+91 98${String(hash % 1000).padStart(3, "0")} ${String(hash).padStart(5, "0")}`
}

// Name, phone number, Call and SMS for the other person in a pickup.
// Phone numbers live in users/{uid}, which only signed-in users can read.
function ContactBox({
  uid,
  name,
  label,
  sms,
  smsLabel = "SMS",
  demo = false,
  demoIfMissing = false,
}: {
  uid?: string | null
  name: string
  label: string
  sms: string // pre-filled SMS text
  smsLabel?: string
  demo?: boolean // demo listing: always show a demo number
  demoIfMissing?: boolean // no phone saved: show a demo number instead
}) {
  const [realPhone, setRealPhone] = useState<string | null>(null)
  const [demoTapped, setDemoTapped] = useState("")
  const lookup = !demo && Boolean(uid)

  useEffect(() => {
    if (!lookup || !uid) return
    let active = true
    getContact(uid)
      .then((c) => active && setRealPhone(c.phone.trim()))
      .catch((error) => {
        console.error("Contact lookup error:", error)
        if (active) setRealPhone("")
      })
    return () => {
      active = false
    }
  }, [lookup, uid])

  if (lookup && realPhone === null) {
    return <p className="mt-3 text-xs text-gray-400">Loading contact...</p>
  }

  const isDemo = demo || (!realPhone && demoIfMissing)
  const phone = isDemo ? demoPhone(name) : realPhone || ""

  const demoClick = (what: string) => (event: React.MouseEvent) => {
    event.preventDefault()
    setDemoTapped(`Demo number: in a real pickup this ${what} ${name} directly.`)
  }
  const btn =
    "flex flex-1 items-center justify-center gap-1.5 rounded-full border bg-white px-3 py-2 text-sm font-semibold transition hover:bg-gray-50"

  return (
    <div className="mt-3 rounded-xl border px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-semibold">{name}</p>

      {phone ? (
        <>
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
              href={`sms:${dialNumber(phone)}?body=${encodeURIComponent(sms)}`}
              onClick={isDemo ? demoClick("sends an SMS to") : undefined}
              className={btn}
            >
              <MessageSquare className="h-4 w-4" /> {smsLabel}
            </a>
          </div>
          {demoTapped && <p className="mt-1.5 text-xs font-medium text-amber-700">{demoTapped}</p>}
        </>
      ) : (
        <p className="mt-0.5 text-sm text-gray-500">No phone number added yet.</p>
      )}
    </div>
  )
}

export default ContactBox

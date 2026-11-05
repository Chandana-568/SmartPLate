import { doc, updateDoc } from "firebase/firestore"
import { MessageCircle } from "lucide-react"
import { useState } from "react"

import { auth, db } from "../firebase"
import type { UserProfile } from "../types"

// Twilio WhatsApp Sandbox: each phone must send "join <code>" once
const SANDBOX_NUMBER = "+1 415 523 8886"
const JOIN_CODE = import.meta.env.VITE_WHATSAPP_JOIN_CODE as string | undefined

function isValidPhone(raw: string) {
  const digits = raw.replace(/\D/g, "")
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91")) || (raw.trim().startsWith("+") && digits.length >= 10)
}

// NGOs choose to receive new-food alerts and live delivery updates on WhatsApp
function WhatsAppSettings({ profile }: { profile: UserProfile }) {
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [optIn, setOptIn] = useState(Boolean(profile.whatsappOptIn))
  const [lat, setLat] = useState<number | null>(profile.latitude ?? null)
  const [lng, setLng] = useState<number | null>(profile.longitude ?? null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [open, setOpen] = useState(!profile.whatsappOptIn)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null)

  // Sends a WhatsApp message to the saved number and shows Twilio's answer
  const sendTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      const token = await auth.currentUser?.getIdToken()
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ event: "test" }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string; to?: string }
      setTestResult(
        response.ok
          ? { ok: true, text: `✅ Sent to ${data.to}. Check WhatsApp on that phone.` }
          : { ok: false, text: `❌ ${data.error ?? `Failed (${response.status})`}${data.to ? ` [${data.to}]` : ""}` }
      )
    } catch {
      setTestResult({ ok: false, text: "❌ Couldn't reach the server." })
    } finally {
      setTesting(false)
    }
  }

  const locate = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser can't share location.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setMessage("")
      },
      () => setMessage("Couldn't get your location. Allow location access and try again.")
    )
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (optIn && !isValidPhone(phone)) {
      setMessage("Enter a valid WhatsApp number, e.g. 98765 43210.")
      return
    }
    try {
      setSaving(true)
      await updateDoc(doc(db, "users", profile.uid), {
        phone: phone.trim(),
        whatsappOptIn: optIn,
        latitude: lat,
        longitude: lng,
      })
      setMessage(optIn ? "Saved. You'll get WhatsApp alerts." : "Saved. WhatsApp alerts are off.")
      if (optIn) setOpen(false)
    } catch (error) {
      console.error("Saving WhatsApp settings failed:", error)
      setMessage("Couldn't save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div className="mt-6 flex max-w-2xl items-center justify-between gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
        <span className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> WhatsApp alerts on for {profile.phone || phone}
        </span>
        <button type="button" onClick={() => setOpen(true)} className="font-semibold underline">
          Edit
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="mt-6 max-w-2xl rounded-2xl border p-5">
      <p className="flex items-center gap-2 font-semibold">
        <MessageCircle className="h-5 w-5 text-green-600" /> WhatsApp alerts
      </p>
      <p className="mt-1 text-sm text-gray-600">
        Get new food near you, plus every step of your deliveries (volunteer assigned, picked up,
        delivered), straight on WhatsApp.
      </p>

      <ol className="mt-4 list-inside list-decimal space-y-1 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <li>
          On WhatsApp, send{" "}
          <span className="font-mono font-semibold">join {JOIN_CODE ?? "<your-code>"}</span> to{" "}
          <span className="font-semibold">{SANDBOX_NUMBER}</span> (one time only).
        </li>
        <li>Enter the same number below and turn alerts on.</li>
      </ol>

      <label className="mt-4 block text-sm font-semibold" htmlFor="wa-phone">
        WhatsApp number
      </label>
      <input
        id="wa-phone"
        type="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="+91 98765 43210"
        className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={locate}
          className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-gray-50"
        >
          📍 {lat != null ? "Update my location" : "Use my location"}
        </button>
        <span className="text-xs text-gray-500">
          {lat != null ? "✓ Location saved: you'll hear about food within 15 km" : "Optional: used to alert you about the nearest food"}
        </span>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={optIn}
          onChange={(event) => setOptIn(event.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>Send me WhatsApp messages about food and deliveries. I can turn this off any time.</span>
      </label>

      {message && <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          disabled={testing}
          onClick={sendTest}
          className="rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50"
        >
          {testing ? "Sending..." : "Send test message"}
        </button>
      </div>

      {testResult && (
        <p className={`mt-3 rounded-xl px-4 py-3 text-sm ${testResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {testResult.text}
        </p>
      )}
    </form>
  )
}

export default WhatsAppSettings

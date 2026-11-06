import { Phone } from "lucide-react"
import { useState } from "react"

import { useAuth } from "../context/auth"
import { isValidPhone, saveMyPhone } from "../services/userService"

// Asks for your phone if your profile has none, so the other side of a
// pickup can call you or SMS you the pickup code
function MyPhoneBanner({ why }: { why: string }) {
  const { user, profile } = useAuth()
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!user || !profile || profile.phone?.trim()) return null

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValidPhone(phone)) {
      setError("Enter a 10-digit mobile number.")
      return
    }
    try {
      setSaving(true)
      setError("")
      await saveMyPhone(user.uid, phone)
    } catch (err) {
      console.error("Save phone failed:", err)
      setError("Couldn't save your number. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <Phone className="h-4 w-4" /> Add your phone number
      </p>
      <p className="mt-1 text-sm text-amber-800">{why}</p>
      <div className="mt-2 flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+91 98765 43210"
          className="flex-1 rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </form>
  )
}

export default MyPhoneBanner

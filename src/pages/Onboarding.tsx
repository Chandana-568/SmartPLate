import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"

import RolePicker from "../components/RolePicker"
import { useAuth } from "../context/auth"
import {
  createUserProfile,
  homeForRole,
} from "../services/userService"
import type { Role } from "../types"

// Shown to signed-in accounts that have no users/{uid} profile yet
// (e.g. accounts created before roles existed).
function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, role: currentRole, loading } = useAuth()

  const [role, setRole] = useState<Exclude<Role, "admin">>("donor")
  const [orgName, setOrgName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (profile) return <Navigate to={homeForRole(currentRole)} replace />

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (role === "ngo" && !orgName.trim()) {
      setError("Please enter your NGO / organisation name.")
      return
    }

    try {
      setSaving(true)
      setError("")
      await createUserProfile(user, {
        name: user.displayName || user.email || "SharePlate user",
        role,
        orgName,
        phone,
      })
      navigate(homeForRole(role))
    } catch (err) {
      console.error(err)
      setError("Unable to save your profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest">
            One last step
          </p>
          <h1 className="mt-4 text-4xl font-bold">
            How will you use SharePlate?
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl border bg-white p-8"
        >
          <RolePicker value={role} onChange={setRole} />

          {role !== "volunteer" && (
            <div className="mt-6">
              <label className="text-sm font-semibold">
                {role === "ngo"
                  ? "NGO / Organisation Name"
                  : "Restaurant / Organisation (optional)"}
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
              />
            </div>
          )}

          <div className="mt-6">
            <label className="text-sm font-semibold">
              Phone / WhatsApp (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  )
}

export default Onboarding

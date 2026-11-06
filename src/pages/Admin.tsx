import {
  Package,
  CheckCircle,
  Clock,
  ShieldAlert,
  Utensils,
} from "lucide-react"
import { useState } from "react"

import ImpactCharts from "../components/ImpactCharts"
import { useAuth } from "../context/auth"
import { clearDemoData, loadDemoData } from "../services/demoDataService"
import {
  approveDonation,
  cancelDonation,
} from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"
import type { FoodDonation } from "../types"
import { formatTime } from "../utils/donationStatus"
import { riskLevel } from "../utils/riskScore"
import FoodImage from "../components/FoodImage"

// Listings the AI screening held back, plus live ones it marked as risky
function FlaggedQueue({ donations }: { donations: FoodDonation[] }) {
  const { user } = useAuth()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const queue = donations.filter(
    (d) =>
      d.status === "under_review" ||
      (d.status === "available" && riskLevel(d.riskScore) === "warning")
  )

  const act = async (id: string, action: () => Promise<void>) => {
    try {
      setBusyId(id)
      setError("")
      await action()
    } catch (err) {
      console.error("Review action failed:", err)
      setError("Couldn't update this listing. Check that you're an admin.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mt-10 rounded-3xl border border-yellow-200 bg-white p-6 md:p-8">
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-yellow-700">
        <ShieldAlert className="h-4 w-4" /> AI screening
      </p>
      <h2 className="mt-2 text-2xl font-bold">
        Flagged listings <span className="text-base font-medium text-gray-400">({queue.length})</span>
      </h2>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {queue.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-gray-50 p-8 text-center text-gray-500">
          Nothing to review. Every listing passed screening. ✅
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {queue.map((d) => (
            <div key={d.id} className="flex flex-col gap-4 rounded-2xl border p-4 md:flex-row">
              <FoodImage donation={d} className="h-32 w-full rounded-xl  md:w-44" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{d.title}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      d.status === "under_review" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    Risk {d.riskScore ?? 0}/100 · {d.status === "under_review" ? "Hidden" : "Live, unverified"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {d.donorName} · {d.quantity} meals · posted {formatTime(d.createdAt)}
                </p>
                {d.aiAnalysis && (
                  <p className="mt-1 text-sm text-gray-500">
                    AI saw: <span className="font-medium text-gray-700">{d.aiAnalysis.detectedFood}</span>{" "}
                    (~{d.aiAnalysis.estimatedServings} servings)
                  </p>
                )}
                <ul className="mt-2 list-inside list-disc text-sm text-yellow-800">
                  {(d.riskReasons ?? []).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2 md:flex-col md:justify-center">
                {d.status === "under_review" && (
                  <button
                    type="button"
                    disabled={busyId === d.id || !user}
                    onClick={() => user && act(d.id, () => approveDonation(d.id, user.uid))}
                    className="flex-1 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:bg-gray-400 md:flex-none"
                  >
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === d.id}
                  onClick={() => {
                    if (window.confirm(`Remove "${d.title}" permanently?`)) {
                      act(d.id, () => cancelDonation(d.id))
                    }
                  }}
                  className="flex-1 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 md:flex-none"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Load / clear the realistic demo dataset (every seeded doc has seed: true)
function DemoDataPanel({ donations }: { donations: FoodDonation[] }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const seeded = donations.filter((d) => d.seed).length

  const run = async (action: () => Promise<string>) => {
    try {
      setBusy(true)
      setMessage(await action())
    } catch (err) {
      console.error("Demo data action failed:", err)
      setMessage("That didn't work. Make sure you're logged in as admin and the latest rules are published.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm">
        <p className="font-semibold">Demo data</p>
        <p className="text-gray-500">
          {seeded > 0
            ? `${seeded} demo listings loaded. Clear them before going live.`
            : "Fill the app with realistic sample donations for your demo."}
        </p>
        {message && <p className="mt-1 font-medium text-gray-700">{message}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || !user || seeded > 0}
          onClick={() =>
            user && run(async () => `Loaded ${await loadDemoData({ uid: user.uid, email: user.email ?? "" })} demo listings.`)
          }
          className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:bg-gray-300"
        >
          Load demo data
        </button>
        <button
          type="button"
          disabled={busy || seeded === 0}
          onClick={() => {
            if (window.confirm("Delete all demo listings?")) {
              run(async () => `Removed ${await clearDemoData()} demo listings.`)
            }
          }}
          className="rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-40"
        >
          Clear demo data
        </button>
      </div>
    </div>
  )
}

function Admin() {
  const donations = useCharityStore(
    (state) => state.donations
  )

  const totalDonations = donations.length

  const availableDonations = donations.filter(
    (donation) => donation.status === "available"
  ).length

  const claimedDonations = donations.filter(
    (donation) => donation.status === "claimed"
  ).length

  const completedDonations = donations.filter(
    (donation) => donation.status === "completed"
  ).length

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">

          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">
            Administration
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Admin Dashboard
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Monitor food donations and rescue activity
            across the SharePlate community.
          </p>

          <DemoDataPanel donations={donations} />

        </div>
      </section>

      {/* Statistics */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total */}
          <div className="rounded-3xl border bg-white shadow-card p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-gray-500">
                Total Donations
              </p>

              <Package className="h-5 w-5" />

            </div>

            <h2 className="mt-4 text-4xl font-bold">
              {totalDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              All food donations
            </p>

          </div>

          {/* Available */}
          <div className="rounded-3xl border bg-white shadow-card p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-gray-500">
                Available
              </p>

              <Utensils className="h-5 w-5" />

            </div>

            <h2 className="mt-4 text-4xl font-bold">
              {availableDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Waiting for rescue
            </p>

          </div>

          {/* Claimed */}
          <div className="rounded-3xl border bg-white shadow-card p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-gray-500">
                Claimed
              </p>

              <Clock className="h-5 w-5" />

            </div>

            <h2 className="mt-4 text-4xl font-bold">
              {claimedDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Active rescues
            </p>

          </div>

          {/* Completed */}
          <div className="rounded-3xl border bg-white shadow-card p-6">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-gray-500">
                Completed
              </p>

              <CheckCircle className="h-5 w-5" />

            </div>

            <h2 className="mt-4 text-4xl font-bold">
              {completedDonations}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Successful rescues
            </p>

          </div>

        </div>

        <FlaggedQueue donations={donations} />

        <ImpactCharts donations={donations} />

        {/* Donations Table */}
        <div className="mt-10 rounded-3xl border bg-white shadow-card p-6 md:p-8">

          <div className="mb-6">

            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              Management
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              All Food Donations
            </h2>

          </div>

          {donations.length === 0 ? (

            <div className="rounded-2xl bg-gray-50 p-10 text-center">

              <p className="text-gray-500">
                No food donations available.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {donations.map((donation) => (

                <div
                  key={donation.id}
                  className="flex flex-col gap-4 rounded-2xl
                  border p-5 md:flex-row md:items-center
                  md:justify-between"
                >

                  {/* Donation Info */}
                  <div>

                    <h3 className="font-semibold">
                      {donation.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      📍 {donation.location}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {donation.quantity} meals
                    </p>

                  </div>

                  {/* Status */}
                  <div>

                    <span
                      className={`inline-block rounded-full
                      px-4 py-2 text-xs font-semibold ${
                        donation.status === "under_review"
                          ? "bg-red-100 text-red-700"
                          : donation.status === "available"
                            ? "bg-green-100 text-green-700"
                            : donation.status === "claimed"
                              ? "bg-yellow-100 text-yellow-700"
                              : donation.status === "picked-up"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {donation.status === "under_review"
                        ? "Under Review"
                        : donation.status === "available"
                          ? "Available"
                          : donation.status === "claimed"
                            ? "Claimed"
                            : donation.status === "picked-up"
                              ? "Picked Up"
                              : "Completed"}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

    </main>
  )
}

export default Admin
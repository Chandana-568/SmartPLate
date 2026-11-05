import { Check } from "lucide-react"

import type { FoodDonation } from "../types"
import {
  deliveryStage,
  formatTime,
  isExpired,
  type DeliveryStage,
} from "../utils/donationStatus"

const ORDER: DeliveryStage[] = [
  "posted",
  "claimed",
  "assigned",
  "picked-up",
  "completed",
]

interface StatusTimelineProps {
  donation: FoodDonation
  // compact = one horizontal row (cards); full = vertical list with details
  variant?: "compact" | "full"
}

function StatusTimeline({ donation, variant = "full" }: StatusTimelineProps) {
  const current = ORDER.indexOf(deliveryStage(donation))
  const expired = isExpired(donation)

  const steps = [
    { label: "Posted", detail: donation.donorName, time: donation.createdAt },
    { label: "Claimed", detail: donation.rescuedByName, time: donation.claimedAt },
    { label: "Volunteer assigned", detail: donation.volunteerName, time: donation.assignedAt },
    { label: "Picked up", detail: donation.volunteerName, time: donation.pickedUpAt },
    { label: "Delivered", detail: donation.rescuedByName, time: donation.completedAt },
  ]

  if (variant === "compact") {
    return (
      <div aria-label="Delivery progress">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div
              key={step.label}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
            >
              <div
                title={step.label}
                className={`h-3 w-3 shrink-0 rounded-full ${
                  index <= current ? "bg-black" : "bg-gray-200"
                }`}
              />
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 ${index < current ? "bg-black" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs font-medium text-gray-600">
          {expired ? "Expired before anyone claimed it" : steps[current].label}
        </p>
      </div>
    )
  }

  return (
    <ol className="space-y-4" aria-label="Delivery progress">
      {steps.map((step, index) => {
        const done = index <= current
        const active = index === current + 1 && !expired

        return (
          <li key={step.label} className="flex gap-3">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                done
                  ? "border-black bg-black text-white"
                  : active
                    ? "border-black bg-white"
                    : "border-gray-200 bg-white"
              }`}
            >
              {done && <Check className="h-3.5 w-3.5" />}
            </div>
            <div className={done ? "" : "text-gray-400"}>
              <p className="text-sm font-semibold">
                {step.label}
                {active && (
                  <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    Next
                  </span>
                )}
              </p>
              {done && (step.detail || step.time) && (
                <p className="text-xs text-gray-500">
                  {[step.detail, formatTime(step.time)].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </li>
        )
      })}
      {expired && (
        <li className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          Pickup time passed before anyone claimed it.
        </li>
      )}
    </ol>
  )
}

export default StatusTimeline

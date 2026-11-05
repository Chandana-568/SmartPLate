import { Bike, HandHeart, Recycle, Utensils } from "lucide-react"

import type { PartnerType, Role } from "../types"
import { PARTNER_TYPES } from "../utils/secondLife"

type PickableRole = Exclude<Role, "admin">

const OPTIONS: {
  role: PickableRole
  title: string
  description: string
  icon: typeof Utensils
}[] = [
  {
    role: "donor",
    title: "Food Donor",
    description: "Restaurant, hotel, hostel, wedding hall or household",
    icon: Utensils,
  },
  {
    role: "ngo",
    title: "NGO / Receiver",
    description: "NGO, ashram, orphanage or shelter",
    icon: HandHeart,
  },
  {
    role: "volunteer",
    title: "Volunteer",
    description: "Pick up and deliver food",
    icon: Bike,
  },
  {
    role: "partner",
    title: "Second-life Partner",
    description: "Poultry farm, goshala, compost or biogas: takes expired food",
    icon: Recycle,
  },
]

// Partner type picker shown when "Second-life Partner" is chosen
export function PartnerTypePicker({
  value,
  onChange,
}: {
  value: PartnerType
  onChange: (type: PartnerType) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(Object.keys(PARTNER_TYPES) as PartnerType[]).map((type) => {
        const selected = value === type
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(type)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
              selected ? "border-black bg-black text-white" : "bg-white hover:border-gray-400"
            }`}
          >
            <span className="mr-1">{PARTNER_TYPES[type].emoji}</span>
            {PARTNER_TYPES[type].label}
          </button>
        )
      })}
    </div>
  )
}

interface RolePickerProps {
  value: PickableRole
  onChange: (role: PickableRole) => void
}

function RolePicker({ value, onChange }: RolePickerProps) {
  return (
    <div className="grid gap-3">
      {OPTIONS.map(({ role, title, description, icon: Icon }) => {
        const selected = value === role

        return (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            aria-pressed={selected}
            className={`flex items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${
              selected
                ? "border-black bg-black text-white"
                : "bg-white hover:border-gray-400"
            }`}
          >
            <Icon className="h-6 w-6 shrink-0" />
            <span>
              <span className="block font-semibold">{title}</span>
              <span
                className={`block text-xs ${
                  selected ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default RolePicker

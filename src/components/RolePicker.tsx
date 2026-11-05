import { Bike, HandHeart, Utensils } from "lucide-react"

import type { Role } from "../types"

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
]

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

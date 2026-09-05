import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { FoodDonation } from "../types"
import { foodDonations } from "../data/mockData"

interface CharityStore {
  donations: FoodDonation[]

  addDonation: (donation: FoodDonation) => void

  setDonations: (donations: FoodDonation[]) => void

  updateDonationStatus: (
    id: string,
    status: FoodDonation["status"]
  ) => void
}

export const useCharityStore = create<CharityStore>()(
  persist(
    (set) => ({
      donations: foodDonations,

      // Add a new donation only if the ID is unique
      addDonation: (donation) =>
        set((state) => {
          const alreadyExists = state.donations.some(
            (item) => item.id === donation.id
          )

          if (alreadyExists) {
            return state
          }

          return {
            donations: [
              ...state.donations,
              donation,
            ],
          }
        }),

      // Replace donations while removing duplicate IDs
      setDonations: (donations) =>
        set(() => {
          const uniqueDonations = Array.from(
            new Map(
              donations.map((donation) => [
                donation.id,
                donation,
              ])
            ).values()
          )

          return {
            donations: uniqueDonations,
          }
        }),

      // Update donation status
      updateDonationStatus: (id, status) =>
        set((state) => ({
          donations: state.donations.map(
            (donation) =>
              donation.id === id
                ? {
                    ...donation,
                    status,
                  }
                : donation
          ),
        })),
    }),

    {
      name: "shareplate-storage",
    }
  )
)
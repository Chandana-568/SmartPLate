import { create } from "zustand"
import type { FoodDonation } from "../types"
import { foodDonations } from "../data/mockData"

interface CharityStore {
  donations: FoodDonation[]
  addDonation: (donation: FoodDonation) => void
  updateDonationStatus: (
    id: string,
    status: FoodDonation["status"]
  ) => void
}

export const useCharityStore = create<CharityStore>((set) => ({
  donations: foodDonations,

  addDonation: (donation) =>
    set((state) => ({
      donations: [...state.donations, donation],
    })),

  updateDonationStatus: (id, status) =>
    set((state) => ({
      donations: state.donations.map((donation) =>
        donation.id === id
          ? { ...donation, status }
          : donation
      ),
    })),
}))
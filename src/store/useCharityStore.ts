import { create } from "zustand"

import type { FoodDonation } from "../types"

// In-memory cache of the Firestore "donations" collection.
// Filled by useDonationsSync (one live subscription for the whole app).
// Firestore is the source of truth: write through donationService,
// never by editing this store directly.
interface CharityStore {
  donations: FoodDonation[]
  loading: boolean
  error: string

  setDonations: (donations: FoodDonation[]) => void
  setError: (error: string) => void
}

export const useCharityStore = create<CharityStore>()((set) => ({
  donations: [],
  loading: true,
  error: "",

  setDonations: (donations) =>
    set({ donations, loading: false, error: "" }),

  setError: (error) => set({ error, loading: false }),
}))

import { useEffect } from "react"

import { subscribeToDonations } from "../services/donationService"
import { useCharityStore } from "../store/useCharityStore"

// Call once at the top of the app. Keeps the store in sync with
// Firestore in real time, so every open browser sees status changes live.
export function useDonationsSync() {
  const setDonations = useCharityStore((state) => state.setDonations)
  const setError = useCharityStore((state) => state.setError)

  useEffect(() => {
    // Clear the old persisted cache (mock data + local-only status changes)
    try {
      localStorage.removeItem("shareplate-storage")
    } catch {
      // storage unavailable: nothing to clear
    }

    const unsubscribe = subscribeToDonations(setDonations, (error) => {
      console.error("Donations subscription error:", error)
      setError("Unable to load donations. Check your connection.")
    })

    return () => unsubscribe()
  }, [setDonations, setError])
}

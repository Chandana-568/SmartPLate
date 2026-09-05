import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore"

import { db } from "../firebase"

import type { FoodDonation } from "../types"

const donationsCollection = collection(
  db,
  "donations"
)

// Add donation to Firestore
export const addDonationToFirestore = async (
  donation: FoodDonation
): Promise<string> => {
  try {
    console.log(
      "Saving donation to Firestore:",
      donation
    )

    const docRef = await addDoc(
      donationsCollection,
      donation
    )

    console.log(
      "Donation saved successfully:",
      docRef.id
    )

    return docRef.id
  } catch (error) {
    console.error(
      "Firestore donation error:",
      error
    )

    throw error
  }
}

// Get all donations from Firestore
export const getDonationsFromFirestore =
  async (): Promise<FoodDonation[]> => {
    try {
      console.log(
        "Loading donations from Firestore..."
      )

      const snapshot = await getDocs(
        donationsCollection
      )

      const donations = snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      ) as FoodDonation[]

      console.log(
        "Donations loaded:",
        donations
      )

      return donations
    } catch (error) {
      console.error(
        "Firestore get donations error:",
        error
      )

      throw error
    }
  }
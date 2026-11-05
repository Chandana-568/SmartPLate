import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  updateDoc,
} from "firebase/firestore"

import { db } from "../firebase"

import type { FoodDonation, UserProfile } from "../types"

const donationsCollection = collection(db, "donations")

export type NewDonation = Omit<
  FoodDonation,
  "id" | "status" | "rescuedBy" | "createdAt"
>

// Add donation to Firestore. Firestore generates the id.
export const addDonationToFirestore = async (
  donation: NewDonation
): Promise<string> => {
  const docRef = await addDoc(donationsCollection, {
    ...donation,
    status: "available",
    rescuedBy: null,
    volunteerId: null,
    createdAt: Date.now(),
  })

  return docRef.id
}

// Live subscription to all donations, newest first.
// Returns the unsubscribe function.
export const subscribeToDonations = (
  onData: (donations: FoodDonation[]) => void,
  onError: (error: Error) => void
) =>
  onSnapshot(
    donationsCollection,
    (snapshot) => {
      const donations = snapshot.docs
        // Spread data first so the real Firestore id always wins over
        // any legacy "id" field stored inside old documents.
        .map((d) => ({ ...d.data(), id: d.id }) as FoodDonation)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))

      onData(donations)
    },
    onError
  )

// NGO claims a donation. A transaction makes sure two NGOs
// can't claim the same food at the same time.
export const claimDonation = async (
  donationId: string,
  ngo: Pick<UserProfile, "uid" | "name" | "orgName">
) => {
  const ref = doc(db, "donations", donationId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref)

    if (!snapshot.exists()) {
      throw new Error("This donation no longer exists.")
    }

    if (snapshot.data().status !== "available") {
      throw new Error("Sorry, this food was just claimed by someone else.")
    }

    transaction.update(ref, {
      status: "claimed",
      rescuedBy: ngo.uid,
      rescuedByName: ngo.orgName || ngo.name,
      claimedAt: Date.now(),
    })
  })
}

// Volunteer (or the claiming NGO) picks the food up from the donor
export const markPickedUp = async (
  donationId: string,
  picker: Pick<UserProfile, "uid" | "name">
) => {
  await updateDoc(doc(db, "donations", donationId), {
    status: "picked-up",
    volunteerId: picker.uid,
    volunteerName: picker.name,
    pickedUpAt: Date.now(),
  })
}

// NGO confirms the food arrived
export const markCompleted = async (donationId: string) => {
  await updateDoc(doc(db, "donations", donationId), {
    status: "completed",
    completedAt: Date.now(),
  })
}

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  updateDoc,
  writeBatch,
} from "firebase/firestore"

import { db } from "../firebase"
import { generatePickupCode } from "../utils/donationStatus"
import { notifyNgos } from "./notifyService"

import type {
  FoodDonation,
  PartnerType,
  SecondLife,
  SecondLifeRoute,
  UserProfile,
} from "../types"

const donationsCollection = collection(db, "donations")

// donations/{id}/private/otp holds the pickup code. Only the donor (and admins)
// can read it; firestore.rules compares the volunteer's code against it.
const otpRef = (donationId: string) =>
  doc(db, "donations", donationId, "private", "otp")

export type NewDonation = Omit<
  FoodDonation,
  "id" | "status" | "rescuedBy" | "createdAt"
>

// Add donation + its private pickup code in one atomic write.
// High-risk donations start as "under_review" (hidden until an admin approves).
export const addDonationToFirestore = async (
  donation: NewDonation,
  status: "available" | "under_review" = "available"
): Promise<string> => {
  const ref = doc(donationsCollection)
  const batch = writeBatch(db)

  batch.set(ref, {
    ...donation,
    status,
    rescuedBy: null,
    volunteerId: null,
    createdAt: Date.now(),
  })
  batch.set(otpRef(ref.id), { code: generatePickupCode() })

  await batch.commit()
  // WhatsApp the nearest NGOs (flagged posts wait for admin approval)
  if (status === "available") notifyNgos("posted", ref.id)
  return ref.id
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
  notifyNgos("claimed", donationId)
}

// Volunteer accepts a delivery task. Transaction stops two volunteers
// taking the same task.
export const acceptTask = async (
  donationId: string,
  volunteer: Pick<UserProfile, "uid" | "name">
) => {
  const ref = doc(db, "donations", donationId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    const data = snapshot.data()

    if (!snapshot.exists() || data?.status !== "claimed") {
      throw new Error("This task is no longer available.")
    }

    if (data.volunteerId) {
      throw new Error("Another volunteer already accepted this task.")
    }

    transaction.update(ref, {
      volunteerId: volunteer.uid,
      volunteerName: volunteer.name,
      assignedAt: Date.now(),
    })
  })
  notifyNgos("assigned", donationId)
}

// Volunteer (or an NGO collecting it themselves) picks the food up.
// The donor's 4-digit code is verified by firestore.rules.
export const markPickedUp = async (
  donationId: string,
  picker: Pick<UserProfile, "uid" | "name">,
  pickupOtp: string
) => {
  try {
    await updateDoc(doc(db, "donations", donationId), {
      status: "picked-up",
      volunteerId: picker.uid,
      volunteerName: picker.name,
      pickupOtp: pickupOtp.trim(),
      pickedUpAt: Date.now(),
    })
    notifyNgos("picked-up", donationId)
  } catch (error) {
    if ((error as { code?: string }).code === "permission-denied") {
      throw new Error("Wrong pickup code. Ask the donor for their 4-digit code.")
    }
    throw error
  }
}

// NGO confirms the food arrived
export const markCompleted = async (donationId: string) => {
  await updateDoc(doc(db, "donations", donationId), {
    status: "completed",
    completedAt: Date.now(),
  })
  notifyNgos("completed", donationId)
}

// Second-life partner (poultry, goshala, compost, biogas) claims expired food.
// Transaction so two partners can't claim the same item.
export const claimSecondLife = async (
  donationId: string,
  partner: Pick<UserProfile, "uid" | "name" | "orgName"> & { partnerType: PartnerType },
  route: SecondLifeRoute
) => {
  const ref = doc(db, "donations", donationId)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    if (!snapshot.exists()) throw new Error("This listing no longer exists.")
    if (snapshot.data().secondLife) throw new Error("Another partner already claimed this.")

    const secondLife: SecondLife = {
      status: "claimed",
      partnerId: partner.uid,
      partnerName: partner.orgName || partner.name,
      partnerType: partner.partnerType,
      route,
      claimedAt: Date.now(),
    }
    transaction.update(ref, { secondLife })
  })
}

export const markSecondLifeCollected = async (donation: FoodDonation) => {
  if (!donation.secondLife) return
  await updateDoc(doc(db, "donations", donation.id), {
    secondLife: { ...donation.secondLife, status: "collected", collectedAt: Date.now() },
  })
}

// Admin approves a flagged listing so NGOs can see it
export const approveDonation = async (donationId: string, adminUid: string) => {
  await updateDoc(doc(db, "donations", donationId), {
    status: "available",
    reviewedBy: adminUid,
    reviewedAt: Date.now(),
  })
  notifyNgos("posted", donationId)
}

// Donor withdraws food that nobody has claimed yet (admins: reject a flagged listing)
export const cancelDonation = async (donationId: string) => {
  const batch = writeBatch(db)
  batch.delete(otpRef(donationId))
  batch.delete(doc(db, "donations", donationId))
  await batch.commit()
}

// Donor reads their own pickup code (null for donations made before codes existed)
export const getPickupCode = async (donationId: string) => {
  const snapshot = await getDoc(otpRef(donationId))
  return snapshot.exists() ? (snapshot.data().code as string) : null
}

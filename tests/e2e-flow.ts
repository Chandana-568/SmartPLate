// End-to-end test of the full rescue flow + firestore.rules, run against the
// local Firebase emulators (never the real project):
//
//   npm run test:e2e
//
// Each role is a separate signed-in Firebase app, like separate browsers.
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app"
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  updateProfile,
} from "firebase/auth"
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore"

const PROJECT_ID = "demo-shareplate"
const ADMIN_EMAIL = "chandana66266@gmail.com" // bootstrap admin in firestore.rules

type Actor = { name: string; uid: string; db: Firestore; app: FirebaseApp }

const apps: FirebaseApp[] = []
const results: { name: string; ok: boolean; detail?: string }[] = []

function newApp(label: string) {
  const app = initializeApp({ apiKey: "demo-key", projectId: PROJECT_ID }, `${label}-${Date.now()}`)
  apps.push(app)
  const auth = getAuth(app)
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, "127.0.0.1", 8080)
  return { app, auth, db }
}

async function signUp(label: string, role: string | null, email?: string): Promise<Actor> {
  const { app, auth, db } = newApp(label)
  const password = `test-${crypto.randomUUID()}`
  const { user } = await createUserWithEmailAndPassword(
    auth,
    email ?? `${label}-${Date.now()}@example.test`,
    password
  )
  await updateProfile(user, { displayName: label })
  if (role) {
    await setDoc(doc(db, "users", user.uid), {
      name: label, email: user.email, role, orgName: role === "ngo" ? `${label} Ashram` : "",
      phone: "", createdAt: Date.now(),
    })
  }
  return { name: label, uid: user.uid, db, app }
}

async function expectAllowed(name: string, action: () => Promise<unknown>) {
  try {
    await action()
    results.push({ name, ok: true })
  } catch (error) {
    results.push({ name, ok: false, detail: `expected ALLOWED, got ${(error as { code?: string }).code ?? error}` })
  }
}

async function expectDenied(name: string, action: () => Promise<unknown>) {
  try {
    await action()
    results.push({ name, ok: false, detail: "expected DENIED, but it was allowed" })
  } catch (error) {
    const code = (error as { code?: string }).code ?? ""
    const ok = code === "permission-denied" || String(error).includes("PERMISSION_DENIED")
    results.push({ name, ok, detail: ok ? undefined : `expected permission-denied, got ${code || error}` })
  }
}

// Same payload shape as donationService.addDonationToFirestore
async function postDonation(actor: Actor, overrides: Record<string, unknown> = {}, code = "4821") {
  const ref = doc(collection(actor.db, "donations"))
  const batch = writeBatch(actor.db)
  batch.set(ref, {
    title: "40 boxes veg biryani", description: "Fresh from a wedding", foodType: "Vegetarian",
    quantity: 40, location: "Vijayanagar, Mysuru", latitude: 12.3, longitude: 76.6,
    pickupBefore: new Date(Date.now() + 3 * 3600e3).toISOString(), expiresAt: Date.now() + 3 * 3600e3, image: "data:image/jpeg;base64,AAAA",
    urgency: "medium", donorName: actor.name, donorId: actor.uid, donorEmail: "",
    aiAnalysis: null, riskScore: 0, riskReasons: [], imageHash: null,
    status: "available", rescuedBy: null, volunteerId: null, createdAt: Date.now(),
    ...overrides,
  })
  batch.set(doc(actor.db, "donations", ref.id, "private", "otp"), { code })
  await batch.commit()
  return ref.id
}

// No client-side status check here on purpose: the rules alone must block bad claims
const claim = (actor: Actor, id: string) =>
  runTransaction(actor.db, async (tx) => {
    const ref = doc(actor.db, "donations", id)
    await tx.get(ref)
    tx.update(ref, { status: "claimed", rescuedBy: actor.uid, rescuedByName: `${actor.name} Ashram`, claimedAt: Date.now() })
  })

const accept = (actor: Actor, id: string) =>
  updateDoc(doc(actor.db, "donations", id), { volunteerId: actor.uid, volunteerName: actor.name, assignedAt: Date.now() })

const pickUp = (actor: Actor, id: string, code: string) =>
  updateDoc(doc(actor.db, "donations", id), {
    status: "picked-up", volunteerId: actor.uid, volunteerName: actor.name, pickupOtp: code, pickedUpAt: Date.now(),
  })

const complete = (actor: Actor, id: string) =>
  updateDoc(doc(actor.db, "donations", id), { status: "completed", completedAt: Date.now() })

async function main() {
  console.log("Signing up test users on the emulator...")
  const donor = await signUp("donor", "donor")
  const ngo = await signUp("ngo", "ngo")
  const ngo2 = await signUp("ngo2", "ngo")
  const volunteer = await signUp("volunteer", "volunteer")
  const volunteer2 = await signUp("volunteer2", "volunteer")
  const admin = await signUp("admin", null, ADMIN_EMAIL)
  const anonymous = newApp("anonymous")

  // ---------- Accounts ----------
  await expectDenied("Users can't make themselves admin at sign-up", async () => {
    const hacker = await signUp("hacker", null)
    await setDoc(doc(hacker.db, "users", hacker.uid), { name: "x", email: "", role: "admin", orgName: "", phone: "", createdAt: 0 })
  })
  await expectDenied("Volunteer can't change own role to NGO", () =>
    updateDoc(doc(volunteer.db, "users", volunteer.uid), { role: "ngo" }))
  await expectDenied("Logged-out visitors can't read user profiles", () =>
    getDocs(collection(anonymous.db, "users")))

  // ---------- Posting ----------
  let id = ""
  await expectAllowed("Donor posts food (with private pickup code)", async () => { id = await postDonation(donor) })
  await expectAllowed("Logged-out visitors can browse donations", () => getDoc(doc(anonymous.db, "donations", id)))
  await expectDenied("Volunteer can't post food", () => postDonation(volunteer))
  await expectDenied("Donor can't post in someone else's name", () => postDonation(donor, { donorId: ngo.uid }))
  await expectDenied("High-risk post (score 80) can't go live as available", () =>
    postDonation(donor, { riskScore: 80 }))
  let flaggedId = ""
  await expectAllowed("High-risk post is saved hidden as under_review", async () => {
    flaggedId = await postDonation(donor, { riskScore: 80, status: "under_review", riskReasons: ["AI: not a real food photo"] })
  })
  await expectDenied("Donor can't lower their own risk score", () =>
    updateDoc(doc(donor.db, "donations", flaggedId), { riskScore: 0 }))
  await expectDenied("Donor can't approve their own flagged post", () =>
    updateDoc(doc(donor.db, "donations", flaggedId), { status: "available" }))
  await expectAllowed("Admin approves the flagged post", () =>
    updateDoc(doc(admin.db, "donations", flaggedId), { status: "available", reviewedBy: admin.uid }))

  // ---------- Pickup code privacy ----------
  await expectAllowed("Donor can read their pickup code", () => getDoc(doc(donor.db, "donations", id, "private", "otp")))
  await expectDenied("Volunteer can't read the pickup code", () => getDoc(doc(volunteer.db, "donations", id, "private", "otp")))
  await expectDenied("NGO can't read the pickup code", () => getDoc(doc(ngo.db, "donations", id, "private", "otp")))

  // ---------- Claim ----------
  await expectDenied("Volunteer can't claim food", () => claim(volunteer, id))
  await expectAllowed("NGO claims the food", () => claim(ngo, id))
  await expectDenied("Second NGO can't claim already-claimed food", () => claim(ngo2, id))
  await expectDenied("Donor can't cancel food once claimed", () => deleteDoc(doc(donor.db, "donations", id)))

  // ---------- Volunteer ----------
  await expectDenied("Volunteer can't pick up before accepting the task", () => pickUp(volunteer, id, "4821"))
  await expectAllowed("Volunteer accepts the delivery task", () => accept(volunteer, id))
  await expectDenied("Second volunteer can't take an assigned task", () => accept(volunteer2, id))
  await expectDenied("Wrong pickup code is rejected", () => pickUp(volunteer, id, "0000"))
  await expectDenied("Other volunteer can't pick up with the right code", () => pickUp(volunteer2, id, "4821"))
  await expectAllowed("Correct pickup code marks it picked up", () => pickUp(volunteer, id, "4821"))

  // ---------- Delivery ----------
  await expectDenied("Second NGO can't confirm someone else's delivery", () => complete(ngo2, id))
  await expectAllowed("NGO confirms food received", () => complete(ngo, id))
  await expectAllowed("Final status is completed", async () => {
    const snap = await getDoc(doc(anonymous.db, "donations", id))
    if (snap.data()?.status !== "completed") throw new Error(`status is ${snap.data()?.status}`)
  })

  // ---------- NGO self-pickup + donor cancel ----------
  const id2 = await postDonation(donor, {}, "1357")
  await claim(ngo, id2)
  await expectAllowed("NGO collects unassigned food itself with the code", () => pickUp(ngo, id2, "1357"))
  const id3 = await postDonation(donor)
  await expectDenied("NGO can't delete a donor's listing", () => deleteDoc(doc(ngo.db, "donations", id3)))
  await expectAllowed("Donor cancels unclaimed food", async () => {
    const batch = writeBatch(donor.db)
    batch.delete(doc(donor.db, "donations", id3, "private", "otp"))
    batch.delete(doc(donor.db, "donations", id3))
    await batch.commit()
  })

  // ---------- Demo data (admin only) ----------
  await expectAllowed("Admin can load a completed demo delivery", () =>
    postDonation(admin, { seed: true, status: "completed", rescuedBy: "seed-ngo-0", completedAt: Date.now() }))
  await expectDenied("Donor can't create an already-completed donation", () =>
    postDonation(donor, { status: "completed" }))

  // ---------- Expired food -> poultry / compost / biogas ----------
  const recycler = await signUp("recycler", "recycler")
  const recycler2 = await signUp("recycler2", "recycler")
  const past = Date.now() - 10 * 60e3
  const recycleBy = (actor: Actor, status: "claimed" | "collected" = "claimed") => ({
    recycle: { status, byId: actor.uid, byName: `${actor.name} Farm`, type: "poultry", claimedAt: Date.now() },
  })
  const freshId = await postDonation(donor)
  await expectDenied("Recycler can't take food that is still fresh", () =>
    updateDoc(doc(recycler.db, "donations", freshId), recycleBy(recycler)))
  const expiredId = await postDonation(donor, { pickupBefore: new Date(past).toISOString(), expiresAt: past })
  await expectDenied("NGO can't claim expired food", () => claim(ngo, expiredId))
  await expectDenied("Donor can't take expired food for recycling", () =>
    updateDoc(doc(donor.db, "donations", expiredId), recycleBy(donor)))
  await expectAllowed("Recycler picks up expired food", () =>
    updateDoc(doc(recycler.db, "donations", expiredId), recycleBy(recycler)))
  await expectDenied("Second recycler can't take the same food", () =>
    updateDoc(doc(recycler2.db, "donations", expiredId), recycleBy(recycler2)))
  await expectDenied("Donor can't delete food being recycled", () =>
    deleteDoc(doc(donor.db, "donations", expiredId)))
  await expectDenied("Other recycler can't mark it collected", () =>
    updateDoc(doc(recycler2.db, "donations", expiredId), recycleBy(recycler, "collected")))
  await expectAllowed("Recycler marks it collected", () =>
    updateDoc(doc(recycler.db, "donations", expiredId), recycleBy(recycler, "collected")))

  const claimedThenExpired = await postDonation(donor, { pickupBefore: new Date(past).toISOString(), expiresAt: past, status: "available" })
  await expectDenied("Volunteer can't accept a task whose food expired", async () => {
    await updateDoc(doc(admin.db, "donations", claimedThenExpired), { status: "claimed", rescuedBy: ngo.uid })
    await accept(volunteer, claimedThenExpired)
  })
  await expectAllowed("NGO-claimed food that expired goes to recyclers too", () =>
    updateDoc(doc(recycler2.db, "donations", claimedThenExpired), { recycle: { ...recycleBy(recycler2).recycle, type: "compost" } }))

  // ---------- NGO can't collect: request a volunteer, or release ----------
  const selfId = await postDonation(donor, {}, "2468")
  await expectAllowed("NGO claims and says it will collect itself", () =>
    updateDoc(doc(ngo.db, "donations", selfId), {
      status: "claimed", rescuedBy: ngo.uid, rescuedByName: "Asha Ashram", claimedAt: Date.now(),
      volunteerRequested: false, volunteerRequestedAt: null,
    }))
  await expectDenied("Volunteer can't take a task the NGO collects itself", () => accept(volunteer, selfId))
  await expectDenied("Another NGO can't request a volunteer for it", () =>
    updateDoc(doc(ngo2.db, "donations", selfId), { volunteerRequested: true, volunteerRequestedAt: Date.now() }))
  await expectAllowed("NGO can't make it, requests a volunteer with a note", () =>
    updateDoc(doc(ngo.db, "donations", selfId), {
      volunteerRequested: true, volunteerRequestedAt: Date.now(), volunteerNote: "Van broke down",
    }))
  await expectDenied("NGO can't sneak other changes into a request", () =>
    updateDoc(doc(ngo.db, "donations", selfId), { volunteerNote: "x", quantity: 999 }))
  await expectAllowed("Volunteer accepts the requested task", () => accept(volunteer2, selfId))
  await expectDenied("NGO can't release food a volunteer already accepted", () =>
    updateDoc(doc(ngo.db, "donations", selfId), {
      status: "available", rescuedBy: null, rescuedByName: null, claimedAt: null,
      volunteerRequested: null, volunteerRequestedAt: null, volunteerNote: null,
    }))

  const releaseId = await postDonation(donor)
  await claim(ngo, releaseId)
  await expectDenied("Another NGO can't release someone else's claim", () =>
    updateDoc(doc(ngo2.db, "donations", releaseId), {
      status: "available", rescuedBy: null, rescuedByName: null, claimedAt: null,
    }))
  await expectAllowed("NGO releases food nobody can collect", () =>
    updateDoc(doc(ngo.db, "donations", releaseId), {
      status: "available", rescuedBy: null, rescuedByName: null, claimedAt: null,
      volunteerRequested: null, volunteerRequestedAt: null, volunteerNote: null,
    }))
  await expectAllowed("Another NGO can claim the released food", () => claim(ngo2, releaseId))

  // ---------- Report ----------
  const failed = results.filter((r) => !r.ok)
  console.log("")
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)

  await Promise.all(apps.map((app) => deleteApp(app)))
  process.exit(failed.length ? 1 : 0)
}

main().catch((error) => {
  console.error("Test run crashed:", error)
  process.exit(1)
})

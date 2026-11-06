// WhatsApp notification test, run on the Firebase emulators in dry-run mode
// (messages are built and returned, never sent):
//
//   npm run test:whatsapp
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app"
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from "firebase/auth"
import {
  collection, connectFirestoreEmulator, doc, getFirestore, setDoc, updateDoc, writeBatch, type Firestore,
} from "firebase/firestore"

import { handleNotifyRequest } from "../server/notify.ts"

const env = { VITE_USE_EMULATORS: "true", WHATSAPP_DRY_RUN: "true", PUBLIC_SITE_URL: "https://shareplate.example" }
const apps: FirebaseApp[] = []
const results: { name: string; ok: boolean; detail?: string }[] = []

type Actor = { uid: string; db: Firestore; token: () => Promise<string> }

async function signUp(label: string, profile: Record<string, unknown>): Promise<Actor> {
  const app = initializeApp({ apiKey: "demo-key", projectId: "demo-shareplate" }, `${label}-${Date.now()}`)
  apps.push(app)
  const auth = getAuth(app)
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, "127.0.0.1", 8080)
  const { user } = await createUserWithEmailAndPassword(auth, `${label}-${Date.now()}@example.test`, `t-${crypto.randomUUID()}`)
  await setDoc(doc(db, "users", user.uid), { name: label, email: user.email, orgName: "", phone: "", createdAt: Date.now(), ...profile })
  return { uid: user.uid, db, token: () => user.getIdToken() }
}

async function notify(actor: Actor | null, event: string, donationId: string) {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (actor) headers.authorization = `Bearer ${await actor.token()}`
  const response = await handleNotifyRequest(
    new Request("http://localhost/api/notify", { method: "POST", headers, body: JSON.stringify({ event, donationId }) }),
    env
  )
  return { status: response.status, body: (await response.json()) as { sent?: number; results?: { to: string; message?: string }[] } }
}

function check(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail: ok ? undefined : detail })
}

async function main() {
  // Vijayanagar, Mysuru
  const here = { latitude: 12.3375, longitude: 76.6194 }
  const donor = await signUp("donor", { role: "donor" })
  const nearNgo = await signUp("near-ngo", { role: "ngo", orgName: "Hope Ashram", phone: "98765 43210", whatsappOptIn: true, latitude: 12.3283, longitude: 76.6311 })
  await signUp("far-ngo", { role: "ngo", orgName: "Far Trust", phone: "+91 91234 56789", whatsappOptIn: true, latitude: 12.9716, longitude: 77.5946 }) // Bengaluru
  await signUp("quiet-ngo", { role: "ngo", orgName: "Quiet Home", phone: "99887 76655", whatsappOptIn: false, latitude: 12.33, longitude: 76.62 })
  const volunteer = await signUp("volunteer", { role: "volunteer" })

  const ref = doc(collection(donor.db, "donations"))
  const batch = writeBatch(donor.db)
  batch.set(ref, {
    title: "40 servings veg biryani", description: "Fresh", foodType: "Vegetarian", quantity: 40,
    location: "Vijayanagar, Mysuru", ...here, pickupBefore: "2026-11-05T19:30", image: "", urgency: "high",
    donorName: "Spice Route Kitchen", donorId: donor.uid, donorEmail: "", aiAnalysis: null, riskScore: 0,
    riskReasons: [], imageHash: null, status: "available", rescuedBy: null, volunteerId: null, createdAt: Date.now(),
  })
  batch.set(doc(donor.db, "donations", ref.id, "private", "otp"), { code: "4821" })
  await batch.commit()
  const id = ref.id

  // ---- Guard rails ----
  check("No login → 401", (await notify(null, "posted", id)).status === 401)
  check("Unknown event → 400", (await notify(donor, "hacked", id)).status === 400)
  const early = await notify(donor, "completed", id)
  check("Fake 'completed' on available food → 409", early.status === 409, `got ${early.status}`)

  // ---- New food alert ----
  const posted = await notify(donor, "posted", id)
  const postedTo = posted.body.results?.map((r) => r.to) ?? []
  check("New-food alert sent", posted.status === 200 && posted.body.sent === 1, JSON.stringify(posted.body))
  check("…only to the nearby opted-in NGO (+919876543210)", postedTo.length === 1 && postedTo[0] === "+919876543210", postedTo.join(","))
  const postedMsg = posted.body.results?.[0]?.message ?? ""
  check("…with distance, pickup time and claim link", /km away/.test(postedMsg) && /5 Nov, 7:30 pm/.test(postedMsg) && postedMsg.includes(`/food/${id}`), postedMsg)
  check("Same alert twice → not re-sent", (await notify(donor, "posted", id)).body.sent === 0)

  // ---- Tracking updates to the claiming NGO only ----
  const steps: [string, Actor, () => Promise<void>, RegExp][] = [
    ["claimed", nearNgo, () => updateDoc(doc(nearNgo.db, "donations", id), { status: "claimed", rescuedBy: nearNgo.uid, rescuedByName: "Hope Ashram", claimedAt: Date.now() }), /You claimed/],
    ["assigned", volunteer, () => updateDoc(doc(volunteer.db, "donations", id), { volunteerId: volunteer.uid, volunteerName: "Arjun K", assignedAt: Date.now() }), /Arjun K accepted/],
    ["picked-up", volunteer, () => updateDoc(doc(volunteer.db, "donations", id), { status: "picked-up", volunteerId: volunteer.uid, volunteerName: "Arjun K", pickupOtp: "4821", pickedUpAt: Date.now() }), /on the way to you/],
    ["delivered", volunteer, () => updateDoc(doc(volunteer.db, "donations", id), { deliveredAt: Date.now() }), /says the food is delivered/],
    ["completed", nearNgo, () => updateDoc(doc(nearNgo.db, "donations", id), { status: "completed", completedAt: Date.now() }), /Delivery complete/],
  ]
  for (const [event, actor, action, pattern] of steps) {
    await action()
    const r = await notify(actor, event, id)
    const to = r.body.results?.map((x) => x.to) ?? []
    const msg = r.body.results?.[0]?.message ?? ""
    check(`'${event}' update → only the claiming NGO`, r.status === 200 && to.length === 1 && to[0] === "+919876543210", JSON.stringify(r.body))
    check(`'${event}' message text`, pattern.test(msg), msg)
  }

  const failed = results.filter((r) => !r.ok)
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`)
  console.log(`\nSample message:\n${postedMsg}\n`)
  console.log(`${results.length - failed.length}/${results.length} checks passed`)
  await Promise.all(apps.map((a) => deleteApp(a)))
  process.exit(failed.length ? 1 : 0)
}

main().catch((error) => {
  console.error("Test run crashed:", error)
  process.exit(1)
})

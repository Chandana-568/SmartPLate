// "Load demo data" for the Admin page: realistic donations across Mysuru so
// the demo never shows empty pages. Every document has seed: true, so
// "Clear demo data" removes exactly these and nothing else.
//
// All names are fictional. Seeded items are owned by the admin who loads them.
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore"

import { db } from "../firebase"
import type { FoodAnalysis, FoodDonation } from "../types"
import { generatePickupCode } from "../utils/donationStatus"

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=70&fm=jpg`
const IMAGES = [
  "1565557623262-b51c2513a641", "1585937421612-70a008356fbe", "1601050690597-df0568f70950",
  "1631515243349-e0cb75fb8d3a", "1589302168068-964664d93dc0", "1606491956689-2ea866880c84",
  "1546833999-b9f581a1996d", "1567188040759-fb8a883dc6d8", "1540189549336-e6e99c3679fe",
  "1555939594-58d7cb561ad1", "1547592180-85f173990554", "1512621776951-a57141f2eefd",
  "1504674900247-0877df9cc836", "1498837167922-ddd27525d352",
]

const PLACES = [
  { name: "Vijayanagar, Mysuru", lat: 12.3375, lng: 76.6194 },
  { name: "Kuvempunagar, Mysuru", lat: 12.2866, lng: 76.6305 },
  { name: "Gokulam, Mysuru", lat: 12.3283, lng: 76.6311 },
  { name: "Hebbal, Mysuru", lat: 12.3536, lng: 76.6122 },
  { name: "Saraswathipuram, Mysuru", lat: 12.3066, lng: 76.6286 },
  { name: "Jayalakshmipuram, Mysuru", lat: 12.3326, lng: 76.629 },
  { name: "Bannimantap, Mysuru", lat: 12.3297, lng: 76.6644 },
  { name: "Nazarbad, Mysuru", lat: 12.3045, lng: 76.661 },
]

const DONORS = [
  "Spice Route Kitchen", "Lakeview Hostel Mess", "Kalyan Mantap Events",
  "Nandini Home Kitchen", "TechPark Canteen", "Sunrise PG Hostel",
]
const NGOS = ["Hope Ashram", "Little Stars Orphanage", "Seva Night Shelter", "Annadaan Trust"]
const VOLUNTEERS = ["Arjun K", "Priya S", "Rahul M", "Sneha R"]

const FOODS: { title: string; description: string; foodType: "Vegetarian" | "Mixed"; safeHours: number }[] = [
  { title: "Veg biryani with raita", description: "Freshly cooked veg biryani from a lunch event, packed in sealed boxes.", foodType: "Vegetarian", safeHours: 4 },
  { title: "Chapati and paneer curry", description: "Soft chapatis with paneer butter masala, kept warm in containers.", foodType: "Vegetarian", safeHours: 5 },
  { title: "Sambar rice and curd rice", description: "Hostel lunch surplus: sambar rice and curd rice in steel vessels.", foodType: "Vegetarian", safeHours: 4 },
  { title: "Chicken pulao", description: "Wedding reception surplus, chicken pulao with onion raita.", foodType: "Mixed", safeHours: 4 },
  { title: "Idli and vada with chutney", description: "Breakfast surplus, idlis and vadas with coconut chutney.", foodType: "Vegetarian", safeHours: 6 },
  { title: "Bread, buns and cakes", description: "Unsold bakery items from today, individually wrapped.", foodType: "Vegetarian", safeHours: 24 },
  { title: "Veg pulao and dal", description: "Corporate canteen surplus, veg pulao with dal fry.", foodType: "Vegetarian", safeHours: 4 },
  { title: "Egg fried rice", description: "Event leftovers, egg fried rice in foil trays.", foodType: "Mixed", safeHours: 4 },
]

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

function localInput(ms: number) {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function analysisFor(food: (typeof FOODS)[number], servings: number): FoodAnalysis {
  return {
    detectedFood: food.title,
    suggestedTitle: food.title,
    suggestedDescription: food.description,
    foodType: food.foodType,
    estimatedServings: servings,
    safeHours: food.safeHours,
    storageTip: food.safeHours > 12 ? "Keep in a dry, covered box." : "Keep covered and deliver within a few hours.",
    isRealFoodPhoto: true,
    looksStockOrScreenshot: false,
    looksSpoiledOrUnsafe: false,
    textIsSpam: false,
    concerns: [],
  }
}

type Seed = Omit<FoodDonation, "id"> & { seed: true }

export function buildDemoDonations(admin: { uid: string; email: string }, now = Date.now()): Seed[] {
  const seeds: Seed[] = []
  // Plan: 12 delivered over the past 2 weeks, 2 on the way, 2 with a volunteer
  // assigned, 2 waiting for a volunteer, 5 available now, 1 flagged by AI.
  const plan: Seed["status"][] = [
    ...Array(12).fill("completed"), "picked-up", "picked-up", "claimed", "claimed",
    "claimed", "claimed", "available", "available", "available", "available", "available",
  ]

  plan.forEach((status, i) => {
    const food = FOODS[i % FOODS.length]
    const place = PLACES[i % PLACES.length]
    const servings = [40, 25, 60, 120, 35, 18, 80, 30, 50, 45, 22, 70][i % 12]
    const completed = status === "completed"
    // Delivered ones are spread over the last 13 days; the rest are from today
    const createdAt = completed ? now - (13 - i) * DAY - (i % 5) * HOUR : now - (i % 4) * 25 * MIN - 20 * MIN
    const ngo = NGOS[i % NGOS.length]
    const volunteer = VOLUNTEERS[i % VOLUNTEERS.length]
    const hasNgo = status !== "available"
    // claimed #14,#15 have a volunteer; #16,#17 are still waiting for one
    const hasVolunteer = completed || status === "picked-up" || (status === "claimed" && i < 16)

    seeds.push({
      seed: true,
      title: `${servings} servings ${food.title.toLowerCase()}`,
      description: food.description,
      quantity: servings,
      foodType: food.foodType,
      location: place.name,
      latitude: place.lat,
      longitude: place.lng,
      pickupBefore: localInput(createdAt + food.safeHours * HOUR),
      urgency: food.safeHours <= 4 ? "high" : "medium",
      status,
      donorName: DONORS[i % DONORS.length],
      donorId: admin.uid,
      donorEmail: admin.email,
      image: IMG(IMAGES[i % IMAGES.length]),
      rescuedBy: hasNgo ? `seed-ngo-${i % NGOS.length}` : null,
      ...(hasNgo ? { rescuedByName: ngo, claimedAt: createdAt + 15 * MIN } : {}),
      volunteerId: hasVolunteer ? `seed-volunteer-${i % VOLUNTEERS.length}` : null,
      ...(hasVolunteer ? { volunteerName: volunteer, assignedAt: createdAt + 25 * MIN } : {}),
      ...(completed || status === "picked-up" ? { pickedUpAt: createdAt + 55 * MIN } : {}),
      ...(completed ? { completedAt: createdAt + 95 * MIN } : {}),
      aiAnalysis: analysisFor(food, servings),
      riskScore: 0,
      riskReasons: [],
      imageHash: null,
      createdAt,
    })
  })

  // One listing the AI screening held back, for the admin review demo
  seeds.push({
    seed: true,
    title: "200 meals available, call now",
    description: "Cheap catering service, order now on 98765 43210 for discounts!",
    quantity: 200,
    foodType: "Vegetarian",
    location: PLACES[0].name,
    latitude: PLACES[0].lat,
    longitude: PLACES[0].lng,
    pickupBefore: localInput(now + 5 * HOUR),
    urgency: "medium",
    status: "under_review",
    donorName: "Unknown Seller",
    donorId: admin.uid,
    donorEmail: admin.email,
    image: IMG(IMAGES[13]),
    rescuedBy: null,
    volunteerId: null,
    aiAnalysis: {
      ...analysisFor(FOODS[0], 4),
      detectedFood: "A single plate of food",
      looksStockOrScreenshot: true,
      textIsSpam: true,
      concerns: ["Looks like a stock photo", "Description contains an advert and phone number"],
    },
    riskScore: 100,
    riskReasons: [
      "AI: looks like a stock image or screenshot",
      "AI: description looks like spam",
      "Claims 200 meals, photo shows about 4",
      "Contains a phone number",
      "Looks like an advert",
    ],
    imageHash: null,
    createdAt: now - 10 * MIN,
  })

  return seeds
}

export async function loadDemoData(admin: { uid: string; email: string }) {
  const batch = writeBatch(db)
  const seeds = buildDemoDonations(admin)
  for (const seed of seeds) {
    const ref = doc(collection(db, "donations"))
    batch.set(ref, seed)
    batch.set(doc(db, "donations", ref.id, "private", "otp"), { code: generatePickupCode() })
  }
  await batch.commit()
  return seeds.length
}

export async function clearDemoData() {
  const snapshot = await getDocs(query(collection(db, "donations"), where("seed", "==", true)))
  const batch = writeBatch(db)
  snapshot.docs.forEach((d) => {
    batch.delete(doc(db, "donations", d.id, "private", "otp"))
    batch.delete(d.ref)
  })
  await batch.commit()
  return snapshot.size
}

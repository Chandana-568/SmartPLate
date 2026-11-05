// Checks the simulated second-life routing (pure functions, no emulator):
//   node tests/second-life.ts
import { simulateSecondLife } from "../src/utils/secondLife.ts"

const MIN = 60 * 1000
const now = Date.now()
const results: { name: string; ok: boolean; detail?: string }[] = []
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail: ok ? undefined : detail })

// Vijayanagar, Mysuru
const base = { quantity: 30, pickupBefore: "", latitude: 12.3375, longitude: 76.6194 }
const veg = { ...base, foodType: "Vegetarian", aiAnalysis: { animalFeedSafe: true, secondLifeReason: "Plain rice and dal: fine for cattle feed" } }

check("Fresh food has no second life", simulateSecondLife({ ...veg, status: "available", expiresAt: now + 60 * MIN }, now) === null)
check("Delivered food has no second life", simulateSecondLife({ ...veg, status: "completed", expiresAt: now - 60 * MIN }, now) === null)
check("Picked-up food (on its way to people) has no second life", simulateSecondLife({ ...veg, status: "picked-up", expiresAt: now - 60 * MIN }, now) === null)

const routed = simulateSecondLife({ ...veg, status: "available", expiresAt: now - 5 * MIN }, now)
check("Expired veg → animal feed", routed?.route === "animal-feed", JSON.stringify(routed))
check("…at the nearest poultry farm or goshala", routed?.place.kind !== "compost" && routed?.km != null && routed.km < 10, JSON.stringify(routed?.place))
check("…stage 'routed' just after expiry", routed?.stage === "routed")
check("…12 kg (30 servings × 0.4 kg)", routed?.kg === 12)

const collecting = simulateSecondLife({ ...veg, status: "claimed", expiresAt: now - 30 * MIN }, now)
check("NGO-claimed but expired before pickup → still gets a second life", collecting != null)
check("…stage 'collecting' after 20 min", collecting?.stage === "collecting")

const received = simulateSecondLife({ ...veg, status: "available", expiresAt: now - 90 * MIN }, now)
check("…stage 'received' after 1 h", received?.stage === "received")

const meat = simulateSecondLife({ ...base, foodType: "Mixed", status: "available", expiresAt: now - 5 * MIN }, now)
check("Non-veg → compost, never animal feed", meat?.route === "compost" && meat.place.kind === "compost", JSON.stringify(meat))

const aiSaysNo = simulateSecondLife({ ...base, foodType: "Vegetarian", aiAnalysis: { animalFeedSafe: false, secondLifeReason: "Fried snack, too oily" }, status: "available", expiresAt: now - 5 * MIN }, now)
check("Veg but AI says not for animals (samosas) → compost", aiSaysNo?.route === "compost" && /too oily/.test(aiSaysNo.reason), JSON.stringify(aiSaysNo))

const old = simulateSecondLife({ ...veg, status: "available", expiresAt: now - 30 * 60 * MIN }, now)
check("Veg expired over 24 h ago → compost", old?.route === "compost", JSON.stringify(old))

const failed = results.filter((r) => !r.ok)
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)

import type { FoodDonation } from "../types"
import { expiryMs, RECYCLE_MAX_AGE_MS } from "./secondLife"

// Rough, commonly used estimates. Say them out loud in the pitch, and call
// them estimates.
export const KG_PER_MEAL = 0.4 // ~400 g of food per meal
export const CO2_KG_PER_FOOD_KG = 2.5 // CO2e avoided per kg of food eaten instead of wasted
// Food sent to animals or compost instead of a landfill still avoids most of
// the landfill methane; we count a smaller, conservative factor for it.
export const CO2_KG_PER_DIVERTED_KG = 0.5

const kg = (d: FoodDonation) => (Number(d.quantity) || 0) * KG_PER_MEAL

// Where every kilogram of listed food ended up
export function computeDestinations(donations: FoodDonation[], now = Date.now()) {
  let people = 0
  let animalFeed = 0
  let compost = 0
  let awaitingPartner = 0
  let landfill = 0

  for (const d of donations) {
    if (d.status === "completed") {
      people += kg(d)
      continue
    }
    if (d.secondLife?.status === "collected") {
      if (d.secondLife.route === "animal-feed") animalFeed += kg(d)
      else compost += kg(d) // compost + biogas
      continue
    }
    // Expired and not (yet) collected by a partner
    const expiry = expiryMs(d)
    if (d.status === "available" && Number.isFinite(expiry) && now > expiry) {
      // Older than the collection window with nobody taking it: honestly lost
      if (now - expiry > RECYCLE_MAX_AGE_MS && !d.secondLife) landfill += kg(d)
      else awaitingPartner += kg(d)
    }
  }

  const diverted = animalFeed + compost
  return {
    people,
    animalFeed,
    compost,
    awaitingPartner,
    landfill,
    diverted,
    handled: people + diverted,
    co2Kg: people * CO2_KG_PER_FOOD_KG + diverted * CO2_KG_PER_DIVERTED_KG,
  }
}

export function computeImpact(donations: FoodDonation[], now = Date.now()) {
  const delivered = donations.filter((d) => d.status === "completed")
  const meals = delivered.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)
  const kgSaved = meals * KG_PER_MEAL
  const destinations = computeDestinations(donations, now)

  return {
    meals,
    kgSaved,
    co2Kg: destinations.co2Kg,
    rescues: delivered.length,
    // By name: demo data is owned by one admin account but has several donors
    donors: new Set(donations.map((d) => d.donorName || d.donorId)).size,
    ngos: new Set(delivered.map((d) => d.rescuedBy).filter(Boolean)).size,
    destinations,
  }
}

export function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-IN")
}

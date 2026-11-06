import type { FoodDonation } from "../types"

// Rough, commonly used estimates. Say them out loud in the pitch.
export const KG_PER_MEAL = 0.4 // ~400 g of food per meal
export const CO2_KG_PER_FOOD_KG = 2.5 // CO2e avoided per kg of food not wasted

export function computeImpact(donations: FoodDonation[]) {
  const delivered = donations.filter((d) => d.status === "completed")
  const meals = delivered.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)
  const kgSaved = meals * KG_PER_MEAL
  // Expired food collected by poultry / compost / biogas units
  const recycledKg = donations
    .filter((d) => d.recycle?.status === "collected")
    .reduce((sum, d) => sum + (Number(d.quantity) || 0) * KG_PER_MEAL, 0)

  return {
    meals,
    kgSaved,
    co2Kg: kgSaved * CO2_KG_PER_FOOD_KG,
    rescues: delivered.length,
    recycledKg,
    // By name: demo data is owned by one admin account but has several donors
    donors: new Set(donations.map((d) => d.donorName || d.donorId)).size,
    ngos: new Set(delivered.map((d) => d.rescuedBy).filter(Boolean)).size,
  }
}

export function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-IN")
}

import type { FoodDonation } from "../types"

export const foodDonations: FoodDonation[] = [
  {
    id: "food-001",
    title: "40 Meal Boxes",
    description: "Fresh vegetarian meals prepared for an event.",
    quantity: 40,
    foodType: "Vegetarian",
    location: "Vijayanagar, Mysuru",
    latitude: 12.2958,
    longitude: 76.6394,
    pickupBefore: "8:30 PM",
    urgency: "high",
    status: "available",
    donorName: "Green Leaf Restaurant",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554",
  },

  {
    id: "food-002",
    title: "25 Food Packets",
    description: "Freshly prepared meals available for immediate pickup.",
    quantity: 25,
    foodType: "Vegetarian",
    location: "Hebbal, Mysuru",
    latitude: 12.3536,
    longitude: 76.6122,
    pickupBefore: "9:00 PM",
    urgency: "medium",
    status: "available",
    donorName: "Annapoorna Caterers",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
  },

  {
    id: "food-003",
    title: "60 Meal Portions",
    description: "Surplus food from a corporate gathering.",
    quantity: 60,
    foodType: "Mixed",
    location: "Bannur Road, Mysuru",
    latitude: 12.2702,
    longitude: 76.6499,
    pickupBefore: "7:45 PM",
    urgency: "high",
    status: "available",
    donorName: "TechPark Events",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  },
]
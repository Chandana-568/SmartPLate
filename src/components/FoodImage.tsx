import { useState } from "react"

import type { FoodDonation } from "../types"
import { dishPhoto, fallbackPhoto, listingPhoto } from "../utils/foodImages"

// Listing photo with a fallback, so a broken or missing image never shows
// as an empty box with alt text
function FoodImage({ donation, className = "" }: { donation: FoodDonation; className?: string }) {
  const [failed, setFailed] = useState(0)
  const src =
    failed === 0 ? listingPhoto(donation) : failed === 1 ? dishPhoto(donation.title, donation.id) : fallbackPhoto(donation.id)

  return (
    <img
      src={src}
      alt={donation.title}
      loading="lazy"
      onError={() => setFailed((n) => Math.min(n + 1, 2))}
      className={`bg-amber-50 object-cover ${className}`}
    />
  )
}

export default FoodImage

import type { FoodDonation } from "../types"
import ContactBox from "./ContactBox"

// Donor contact on Expired Food cards (poultry / compost / biogas units)
function DonorContact({ donation, useFor }: { donation: FoodDonation; useFor: string }) {
  return (
    <ContactBox
      uid={donation.donorId}
      name={donation.donorName}
      label="Donor contact"
      demo={Boolean(donation.seed)}
      demoIfMissing
      sms={
        `Hi ${donation.donorName}, I saw your expired listing "${donation.title}" on SharePlate. ` +
        `Can I collect it for ${useFor}?`
      }
    />
  )
}

export default DonorContact

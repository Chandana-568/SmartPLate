import type { FoodDonation } from "../types"

// Real photos of Indian dishes (Unsplash, free to use), picked by hand
const photo = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&fm=jpg&fit=crop`

const DISHES: { match: RegExp; ids: string[] }[] = [
  // order matters: first match wins
  { match: /egg|fried rice/i, ids: ["1603133872878-684f208fb84b", "1609570324378-ec0c4c9b6ba8", "1664717698774-84f62382613b"] },
  { match: /chicken|mutton|non.?veg/i, ids: ["1589302168068-964664d93dc0", "1631515243349-e0cb75fb8d3a", "1716550781939-beb7d7247aae"] },
  { match: /biryani/i, ids: ["1563379091339-03b21ab4a4f8", "1642821373181-696a54913e93", "1697155406055-2db32d47ca07"] },
  { match: /paneer|chapati|roti|naan|paratha|curry/i, ids: ["1712757248842-04f6e3844374", "1565557623262-b51c2513a641", "1631452180539-96aca7d48617", "1567337710282-00832b415979"] },
  { match: /idli|vada|dosa|upma|chutney/i, ids: ["1632104667384-06f58cb7ad44", "1680359871322-aabe6b33eff5", "1630383249896-424e482df921", "1730191843435-073792ba22bc"] },
  { match: /bread|bun|cake|bakery|pastr/i, ids: ["1608198093002-ad4e005484ec", "1588861472194-6883d8b5e552", "1605002619349-82dce91bcee0"] },
  { match: /sambar|curd rice|rasam|meals|south/i, ids: ["1743674453123-93356ade2891", "1680993032090-1ef7ea9b51e5", "1711153419402-336ee48f2138"] },
  { match: /pulao|dal|khichdi|rice/i, ids: ["1788603092417-a01e665e0ab2", "1626500154744-e4b394ffea16", "1788604619692-120407b7207c"] },
]
// Generic Indian meal (thali) for anything else
const DEFAULT_IDS = ["1742281257687-092746ad6021", "1742281258189-3b933879867a", "1589778655375-3e622a9fc91c"]

function pick(ids: string[], key: string) {
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return ids[hash % ids.length]
}

// Photo for a dish name (same listing -> same photo every time)
export function dishPhoto(title: string, key = title, width = 800) {
  const dish = DISHES.find((d) => d.match.test(title))
  return photo(pick(dish ? dish.ids : DEFAULT_IDS, key), width)
}

export const fallbackPhoto = (key = "food") => photo(pick(DEFAULT_IDS, key))

// What to show for a listing: demo listings get a matching dish photo,
// real ones keep the donor's own photo (or a dish photo if they had none)
export function listingPhoto(d: FoodDonation) {
  const matchesDish = DISHES.some((dish) => dish.match.test(d.title))
  if (d.seed && matchesDish) return dishPhoto(d.title, d.id)
  return d.image || dishPhoto(d.title, d.id)
}

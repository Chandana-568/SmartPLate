import { Camera, Loader2, RefreshCw, Sparkles, X } from "lucide-react"
import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import AIInsightBox from "../components/AIInsightBox"
import CountdownTimer from "../components/CountdownTimer"
import { MAX_PICKUP_HOURS, useNow } from "../hooks/useNow"
import { useAuth } from "../context/auth"
import { AiUnavailableError, analyzeFoodPhoto } from "../services/aiService"
import { addDonationToFirestore } from "../services/donationService"
import { isValidPhone, saveMyPhone } from "../services/userService"
import { useCharityStore } from "../store/useCharityStore"
import type { FoodAnalysis } from "../types"
import { compressImage, hashImage, type CompressedImage } from "../utils/image"
import { calculateRisk, REVIEW_THRESHOLD } from "../utils/riskScore"

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352"

// datetime-local inputs want local time "YYYY-MM-DDTHH:mm"
function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type AiStatus = "idle" | "analyzing" | "done" | "unavailable" | "error"

function Donate() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const allDonations = useCharityStore((state) => state.donations)
  const fileInput = useRef<HTMLInputElement>(null)
  const now = useNow()
  const maxPickup = toLocalInputValue(new Date(now + MAX_PICKUP_HOURS * 60 * 60 * 1000))

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [foodType, setFoodType] = useState("Vegetarian")
  const [quantity, setQuantity] = useState("")
  const [location, setLocation] = useState("")
  // Contact number: saved to your profile (never on the public listing),
  // so only the NGO / volunteer collecting your food can call or SMS you
  const [phoneInput, setPhoneInput] = useState<string | null>(null)
  const phone = phoneInput ?? profile?.phone ?? ""
  const [pickupBefore, setPickupBefore] = useState("")

  const [photo, setPhoto] = useState<CompressedImage | null>(null)
  const [imageHash, setImageHash] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null)
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle")
  const [aiMessage, setAiMessage] = useState("")

  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // ---------------- AI photo analysis ----------------

  const runAnalysis = async (image: CompressedImage) => {
    setAiStatus("analyzing")
    setAiMessage("")
    try {
      const result = await analyzeFoodPhoto({
        base64: image.base64,
        mediaType: image.mediaType,
        title,
        description,
        quantity: quantity ? Number(quantity) : undefined,
      })
      setAnalysis(result)
      setAiStatus("done")

      // Auto-fill: never overwrite what the donor already typed
      if (!title.trim()) setTitle(result.suggestedTitle)
      if (!description.trim()) setDescription(result.suggestedDescription)
      if (!quantity && result.estimatedServings > 0) {
        setQuantity(String(result.estimatedServings))
      }
      setFoodType(result.foodType)
      if (!pickupBefore) {
        // Never more than the 5-hour pickup window
        const hours = Math.min(result.safeHours, MAX_PICKUP_HOURS)
        const safeUntil = new Date(Date.now() + hours * 60 * 60 * 1000)
        setPickupBefore(toLocalInputValue(safeUntil))
      }
    } catch (err) {
      setAnalysis(null)
      if (err instanceof AiUnavailableError) {
        console.info("AI auto-fill unavailable:", err.message)
        setAiStatus("unavailable")
        setAiMessage("AI auto-fill isn't available right now. Fill in the form yourself.")
      } else {
        console.error("AI analysis failed:", err)
        setAiStatus("error")
        setAiMessage(err instanceof Error ? err.message : "AI analysis failed.")
      }
    }
  }

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = "" // allow picking the same file again
    if (!file) return

    try {
      setError("")
      const image = await compressImage(file)
      setPhoto(image)
      setImageHash(await hashImage(image.base64))
      await runAnalysis(image)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.")
    }
  }

  const removePhoto = () => {
    setPhoto(null)
    setImageHash(null)
    setAnalysis(null)
    setAiStatus("idle")
    setAiMessage("")
  }

  // ---------------- Location ----------------

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.")
      return
    }

    setLocationLoading(true)
    setLocationError("")
    setError("")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setLocationLoading(false)
      },
      () => {
        setLocationError("Unable to get your location. Please allow location access.")
        setLocationLoading(false)
      }
    )
  }

  // ---------------- Submit ----------------

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!user) {
      setError("Please login before donating food.")
      return
    }

    if (!title.trim() || !description.trim() || !quantity || !location.trim() || !pickupBefore) {
      setError("Please fill in all required fields.")
      return
    }

    const mealQuantity = Number(quantity)
    if (!Number.isFinite(mealQuantity) || mealQuantity <= 0) {
      setError("Number of meals must be greater than 0.")
      return
    }

    // Pickup window: at least 15 minutes, at most 5 hours from now
    const msUntilPickup = new Date(pickupBefore).getTime() - Date.now()
    if (!Number.isFinite(msUntilPickup) || msUntilPickup < 15 * 60 * 1000) {
      setError("Pickup time must be at least 15 minutes from now.")
      return
    }
    if (msUntilPickup > MAX_PICKUP_HOURS * 60 * 60 * 1000) {
      setError(`Pickup time can be at most ${MAX_PICKUP_HOURS} hours from now.`)
      return
    }

    if (!isValidPhone(phone)) {
      setError("Add a 10-digit contact number so the NGO or volunteer can reach you.")
      return
    }

    // Spam / safety screening: AI signals + behaviour rules
    const risk = calculateRisk({
      title,
      description,
      quantity: mealQuantity,
      pickupBefore,
      analysis,
      hasPhoto: Boolean(photo),
      imageHash,
      donorId: user.uid,
      allDonations,
    })
    const needsReview = risk.score >= REVIEW_THRESHOLD

    setError("")
    setLoading(true)

    try {
      if (phone.trim() !== (profile?.phone ?? "").trim()) await saveMyPhone(user.uid, phone)
      await addDonationToFirestore(
        {
          title: title.trim(),
          description: description.trim(),
          foodType,
          quantity: mealQuantity,
          location: location.trim(),
          latitude,
          longitude,
          pickupBefore,
          expiresAt: new Date(pickupBefore).getTime(),
          image: photo?.dataUrl ?? DEFAULT_IMAGE,
          urgency: analysis && analysis.safeHours <= 4 ? "high" : "medium",
          donorName: profile?.orgName || user.displayName || user.email || "Community Donor",
          donorId: user.uid,
          donorEmail: user.email || "",
          aiAnalysis: analysis,
          riskScore: risk.score,
          riskReasons: risk.reasons,
          imageHash,
        },
        needsReview ? "under_review" : "available"
      )

      navigate("/my-donations")
    } catch (err) {
      console.error("Error adding donation:", err)
      setError("Unable to donate food. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest">Give Back</p>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">Donate surplus food.</h1>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Snap a photo and our AI fills in the details for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 rounded-3xl border bg-white p-8 md:p-10">
          {/* Photo + AI */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Food photo (AI auto-fill)
            </label>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhoto}
              className="hidden"
            />

            {!photo ? (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-gray-500 transition hover:border-black hover:text-black"
              >
                <Camera className="h-8 w-8" />
                <span className="font-semibold">Take or upload a photo</span>
                <span className="text-xs">AI detects the food, servings and how long it stays safe</span>
              </button>
            ) : (
              <div className="mt-2 overflow-hidden rounded-2xl border">
                <div className="relative">
                  <img src={photo.dataUrl} alt="Food to donate" className="max-h-72 w-full object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    aria-label="Remove photo"
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow transition hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {aiStatus === "analyzing" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> AI is analysing your food...
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {aiStatus === "done" && analysis && <AIInsightBox analysis={analysis} />}

                  {(aiStatus === "unavailable" || aiStatus === "error") && (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                      <span>{aiMessage}</span>
                      {aiStatus === "error" && (
                        <button
                          type="button"
                          onClick={() => runAnalysis(photo)}
                          className="flex shrink-0 items-center gap-1 font-semibold"
                        >
                          <RefreshCw className="h-4 w-4" /> Retry
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="mt-3 text-sm font-semibold text-gray-600 hover:text-black"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Food Name */}
          <div className="mt-8">
            <label className="text-sm font-semibold">Food name *</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: 40 Meal Boxes"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="text-sm font-semibold">Description *</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the food..."
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {/* Food Type + Quantity */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Food type *</label>
              <select
                value={foodType}
                onChange={(event) => setFoodType(event.target.value)}
                className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none"
              >
                <option value="Vegetarian">Vegetarian</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Number of meals *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Example: 40"
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Contact number */}
          <div className="mt-6">
            <label className="text-sm font-semibold">Contact number *</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="+91 98765 43210"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Only the NGO or volunteer collecting your food sees it, to call you or get your pickup code by SMS.
            </p>
          </div>

          {/* Location */}
          <div className="mt-6">
            <label className="text-sm font-semibold">Pickup location *</label>
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Example: Vijayanagar, Mysuru"
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="mt-3 rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {locationLoading ? "Getting location..." : "📍 Use My Location"}
            </button>
            {latitude !== null && longitude !== null && (
              <p className="mt-3 text-sm text-green-600">✓ Location coordinates captured</p>
            )}
            {locationError && <p className="mt-3 text-sm text-red-600">{locationError}</p>}
          </div>

          {/* Pickup Time: max 5 hours */}
          <div className="mt-6">
            <label className="text-sm font-semibold">
              Pickup before * <span className="font-normal text-gray-500">(max {MAX_PICKUP_HOURS} hours)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setPickupBefore(toLocalInputValue(new Date(Date.now() + hours * 60 * 60 * 1000)))}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-gray-50"
                >
                  +{hours} h
                </button>
              ))}
            </div>
            <input
              type="datetime-local"
              value={pickupBefore}
              max={maxPickup}
              onChange={(event) => setPickupBefore(event.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />
            {analysis && (
              <p className="mt-2 text-xs text-gray-500">
                AI suggests this food stays safe for about {analysis.safeHours} hours
                {analysis.safeHours > MAX_PICKUP_HOURS ? ` (capped at ${MAX_PICKUP_HOURS} h)` : ""}.
              </p>
            )}
            {pickupBefore && (
              <div className="mt-3">
                <CountdownTimer pickupBefore={pickupBefore} />
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || aiStatus === "analyzing"}
            className="mt-8 w-full rounded-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Saving Donation..." : aiStatus === "analyzing" ? "Waiting for AI..." : "Donate Food"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Every listing is screened for food safety and authenticity before NGOs see it.
          </p>
        </form>
      </div>
    </main>
  )
}

export default Donate

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCharityStore } from "../store/useCharityStore";

function Donate() {
  const navigate = useNavigate();

  const addDonation = useCharityStore((state) => state.addDonation);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [foodType, setFoodType] = useState("Vegetarian");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [pickupBefore, setPickupBefore] = useState("");
  const [image, setImage] = useState("");
  const [latitude, setLatitude] = useState(0)
const [longitude, setLongitude] = useState(0)
const [locationLoading, setLocationLoading] = useState(false)
const [locationError, setLocationError] = useState("")
  const [error, setError] = useState("");

  const handleGetLocation = () => {
  if (!navigator.geolocation) {
    setLocationError("Geolocation is not supported by your browser.")
    return
  }

  setLocationLoading(true)
  setLocationError("")

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLatitude(position.coords.latitude)
      setLongitude(position.coords.longitude)

      setLocationLoading(false)
    },
    () => {
      setLocationError(
        "Unable to get your location. Please allow location access."
      )

      setLocationLoading(false)
    }
  )
}

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title || !description || !quantity || !location || !pickupBefore) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");

  addDonation({
  id: `food-${Date.now()}`,
  title,
  description,
  foodType,
  quantity: Number(quantity),
  location,
  latitude,
  longitude,
  pickupBefore,
  image:
    image ||
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352",
  urgency: "medium",
  status: "available",
  donorName: "Community Donor",
})

    navigate("/food");
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest">
            Give Back
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Donate surplus food.
          </h1>

          <p className="mt-4 text-lg leading-8 text-gray-600">
            Have extra food? Share it with someone who needs it instead of
            letting it go to waste.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-12 rounded-3xl border bg-white p-8 md:p-10"
        >
          {/* Food Name */}
          <div>
            <label className="text-sm font-semibold">Food name</label>

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
            <label className="text-sm font-semibold">Description</label>

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
              <label className="text-sm font-semibold">Food type</label>

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
              <label className="text-sm font-semibold">Number of meals</label>

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

          {/* Location */}
     <div className="mt-6">
  <label className="text-sm font-semibold">
    Pickup location
  </label>

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
    {locationLoading
      ? "Getting location..."
      : "📍 Use My Location"}
  </button>

  {latitude !== 0 && longitude !== 0 && (
    <p className="mt-3 text-sm text-green-600">
      ✓ Location coordinates captured
    </p>
  )}

  {locationError && (
    <p className="mt-3 text-sm text-red-600">
      {locationError}
    </p>
  )}
</div>

          {/* Pickup Time */}
          <div className="mt-6">
            <label className="text-sm font-semibold">Pickup before</label>

            <input
              type="datetime-local"
              value={pickupBefore}
              onChange={(event) => setPickupBefore(event.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {/* Image */}
          <div className="mt-6">
            <label className="text-sm font-semibold">Food image URL</label>

            <input
              type="url"
              value={image}
              onChange={(event) => setImage(event.target.value)}
              placeholder="https://..."
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
            />

            <p className="mt-2 text-xs text-gray-500">
              Optional. A default image will be used if left empty.
            </p>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="mt-8 w-full rounded-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800"
          >
            Donate Food
          </button>
        </form>
      </div>
    </main>
  );
}

export default Donate;

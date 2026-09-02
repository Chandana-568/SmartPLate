import { HandHeart, MapPin, Truck } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: HandHeart,
    title: "Share Surplus Food",
    description:
      "Restaurants, events, and individuals can post their extra food before it goes to waste.",
  },
  {
    number: "02",
    icon: MapPin,
    title: "Find Nearby Food",
    description:
      "Volunteers can discover available food donations based on location, quantity, and urgency.",
  },
  {
    number: "03",
    icon: Truck,
    title: "Rescue & Deliver",
    description:
      "Volunteers collect the food and help get it to organizations and communities that need it.",
  },
]

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest">
          How it works
        </p>

        <h2 className="mt-4 text-4xl font-bold md:text-5xl">
          From surplus to someone&apos;s plate.
        </h2>

        <p className="mt-5 text-lg leading-8 text-gray-600">
          SharePlate makes it simple to turn excess food into meaningful
          impact.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon

          return (
            <div
              key={step.number}
              className="group rounded-3xl border p-8 transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-400">
                  {step.number}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              <h3 className="mt-10 text-2xl font-bold">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-gray-600">
                {step.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default HowItWorks
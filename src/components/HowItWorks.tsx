import { Bike, HandHeart, Recycle, ShieldCheck } from "lucide-react"

const steps = [
  {
    icon: HandHeart,
    tint: "bg-brand-50 text-brand-700",
    title: "Donor posts surplus",
    description: "Homes, hostels, caterers and events post extra food with a photo and a pickup timer of up to 5 hours.",
  },
  {
    icon: ShieldCheck,
    tint: "bg-sky-50 text-sky-700",
    title: "AI checks it, NGOs claim",
    description: "AI screens the photo for spam and spoilage. Nearby NGOs get a WhatsApp alert and claim it.",
  },
  {
    icon: Bike,
    tint: "bg-saffron-50 text-saffron-600",
    title: "Volunteer delivers",
    description: "The NGO collects it or asks a volunteer. A 4-digit code from the donor confirms the pickup.",
  },
  {
    icon: Recycle,
    tint: "bg-emerald-50 text-emerald-700",
    title: "Nothing goes to waste",
    description: "If the timer runs out, poultry farms, compost and biogas units collect it instead of the bin.",
  },
]

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">How it works</p>
        <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">From surplus to someone&apos;s plate.</h2>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          Four simple steps, and every kilo of food ends up feeding people or the soil.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={step.title}
              className="group relative rounded-3xl border bg-white p-7 shadow-card transition duration-300 hover:-translate-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.tint}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-4xl font-extrabold text-gray-100 transition group-hover:text-brand-100">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 leading-7 text-gray-600">{step.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default HowItWorks

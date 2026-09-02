const stats = [
  {
    value: "12,450+",
    label: "Meals Rescued",
  },
  {
    value: "840+",
    label: "Food Donors",
  },
  {
    value: "326+",
    label: "Volunteers",
  },
  {
    value: "18",
    label: "Partner NGOs",
  },
]

function ImpactStats() {
  return (
    <section className="border-y">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="px-6 py-10 text-center"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              {stat.value}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ImpactStats
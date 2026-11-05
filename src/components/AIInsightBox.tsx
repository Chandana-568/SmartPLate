import { AlertTriangle, Clock, Recycle, ShieldCheck, Sparkles, Users } from "lucide-react"

import type { FoodAnalysis } from "../types"

// What the AI saw in the photo, shown on the Donate form and food details page
function AIInsightBox({ analysis }: { analysis: FoodAnalysis }) {
  const flags = [
    !analysis.isRealFoodPhoto && "Doesn't look like a real food photo",
    analysis.looksStockOrScreenshot && "Looks like a stock image or screenshot",
    analysis.looksSpoiledOrUnsafe && "Food may be spoiled or unsafe",
    analysis.textIsSpam && "Text looks like spam",
    ...analysis.concerns,
  ].filter(Boolean) as string[]

  const clean = flags.length === 0

  return (
    <div className={`rounded-2xl border p-4 ${clean ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4" /> AI insights
      </p>

      <p className="mt-2 text-lg font-bold">{analysis.detectedFood}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <Users className="mb-1 h-4 w-4" />~{analysis.estimatedServings} servings
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          <Clock className="mb-1 h-4 w-4" />Safe ~{analysis.safeHours} h
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2">
          {analysis.foodType === "Vegetarian" ? "🟢" : "🟤"}
          <br />
          {analysis.foodType}
        </div>
      </div>

      {analysis.storageTip && (
        <p className="mt-3 text-sm text-gray-700">💡 {analysis.storageTip}</p>
      )}

      {/* Second life, if nobody eats it in time */}
      {analysis.secondLifeRoute && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm text-gray-700">
          <Recycle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">If it expires:</span>{" "}
            {analysis.secondLifeRoute === "animal-feed" ? "🐾 OK for animal feed" : "🌱 Compost only"}
            {analysis.secondLifeReason ? `: ${analysis.secondLifeReason}` : ""}
          </span>
        </p>
      )}

      {clean ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-700">
          <ShieldCheck className="h-4 w-4" /> Passed AI safety check
        </p>
      ) : (
        <ul className="mt-3 space-y-1 text-sm text-yellow-800">
          {flags.map((flag) => (
            <li key={flag} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {flag}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AIInsightBox

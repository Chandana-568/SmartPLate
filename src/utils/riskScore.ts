import type { FoodAnalysis, FoodDonation } from "../types"

// 0-39 goes live, 40-69 goes live with an "Unverified" badge,
// 70+ is hidden ("under_review") until an admin approves it.
export const REVIEW_THRESHOLD = 70
export const WARNING_THRESHOLD = 40

const SPAM_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /https?:\/\/|www\.|\.(com|in|net|xyz)\b/i, reason: "Contains a link" },
  { pattern: /(\+?\d[\s-]?){10,}/, reason: "Contains a phone number" },
  { pattern: /(.)\1{5,}/, reason: "Repeated characters (looks like gibberish)" },
  { pattern: /\b(discount|offer|buy now|order now|cheap|catering service|call now)\b/i, reason: "Looks like an advert" },
]

export interface RiskInput {
  title: string
  description: string
  quantity: number
  pickupBefore: string
  analysis: FoodAnalysis | null
  hasPhoto: boolean
  imageHash: string | null
  donorId: string
  allDonations: FoodDonation[]
  now?: number
}

export interface RiskResult {
  score: number
  reasons: string[]
}

export function calculateRisk(input: RiskInput): RiskResult {
  const now = input.now ?? Date.now()
  let score = 0
  const reasons: string[] = []
  const add = (points: number, reason: string) => {
    score += points
    reasons.push(reason)
  }

  // ---- AI signals (only when the photo was analysed) ----
  const ai = input.analysis
  if (ai) {
    // Safety-critical: any one of these alone hides the listing
    if (!ai.isRealFoodPhoto) add(75, "AI: not a real food photo")
    if (ai.looksSpoiledOrUnsafe) add(75, "AI: food may be spoiled or unsafe")
    // Suspicious: live with a warning, hidden if combined with anything else
    if (ai.looksStockOrScreenshot) add(45, "AI: looks like a stock image or screenshot")
    if (ai.textIsSpam) add(45, "AI: description looks like spam")
    if (ai.estimatedServings > 0 && input.quantity > ai.estimatedServings * 3) {
      add(40, `Claims ${input.quantity} meals, photo shows about ${ai.estimatedServings}`)
    }
  } else if (!input.hasPhoto) {
    add(10, "No photo")
  }

  // ---- Text rules ----
  const text = `${input.title} ${input.description}`
  for (const { pattern, reason } of SPAM_PATTERNS) {
    if (pattern.test(text)) add(35, reason)
  }

  // ---- Behaviour rules ----
  const oneHourAgo = now - 60 * 60 * 1000
  const recentPosts = input.allDonations.filter(
    (d) => d.donorId === input.donorId && (d.createdAt ?? 0) > oneHourAgo
  ).length
  if (recentPosts >= 5) add(30, `${recentPosts} posts in the last hour`)

  if (input.imageHash) {
    const reused = input.allDonations.some((d) => d.imageHash === input.imageHash)
    if (reused) add(45, "Same photo was used in an earlier donation")
  }

  if (input.quantity > 500) add(20, "Unusually large quantity")

  const deadline = new Date(input.pickupBefore).getTime()
  if (Number.isFinite(deadline) && deadline < now) add(50, "Pickup time is already in the past")

  return { score: Math.min(100, score), reasons }
}

export function riskLevel(score = 0): "ok" | "warning" | "review" {
  if (score >= REVIEW_THRESHOLD) return "review"
  if (score >= WARNING_THRESHOLD) return "warning"
  return "ok"
}

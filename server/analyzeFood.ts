// AI food-photo analysis: one Claude vision call that both auto-fills the
// donation form and screens the photo for spam / unsafe food.
//
// Runs server-side only (Netlify Function in production, Vite middleware in
// dev) so the Anthropic API key never reaches the browser.

import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import { z } from "zod"

const DEFAULT_MODEL = "claude-opus-5-5"
const MAX_IMAGE_BASE64_CHARS = 5_000_000 // ~3.7 MB image
const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const

export const FoodAnalysisSchema = z.object({
  detectedFood: z.string().describe("Short name of the food you see, e.g. 'Veg biryani with raita'"),
  suggestedTitle: z.string().describe("Listing title, max 60 characters, e.g. '40 boxes of veg biryani'"),
  suggestedDescription: z.string().describe("One or two friendly sentences for NGOs: what it is, how it is packed"),
  foodType: z.enum(["Vegetarian", "Mixed"]).describe("Vegetarian if no meat, fish or egg is visible, otherwise Mixed"),
  estimatedServings: z.number().describe("Your best estimate of how many people this feeds; 0 if not food"),
  safeHours: z.number().describe("Hours this food stays safe at room temperature from now; cooked rice/curry ~4, bread ~24, packaged ~48"),
  storageTip: z.string().describe("One short handling tip for the volunteer"),
  isRealFoodPhoto: z.boolean().describe("True only for a genuine camera photo of real food"),
  looksStockOrScreenshot: z.boolean().describe("True if it looks like a stock photo, a watermarked image, a screenshot or a photo of a screen"),
  looksSpoiledOrUnsafe: z.boolean().describe("True if you see mould, rot, flies, garbage, half-eaten scraps or unsafe packaging"),
  textIsSpam: z.boolean().describe("True if the donor's text contains ads, links, phone numbers, abuse or gibberish; false if no text was given"),
  concerns: z.array(z.string()).describe("Short reasons for anything suspicious; empty if all looks fine"),
})

export type FoodAnalysis = z.infer<typeof FoodAnalysisSchema>

export interface AnalyzeRequestBody {
  imageBase64: string
  mediaType: (typeof ALLOWED_MEDIA_TYPES)[number]
  title?: string
  description?: string
  quantity?: number
}

type Env = Record<string, string | undefined>

const PROMPT = (body: AnalyzeRequestBody) => `You screen food donations for SharePlate, a platform in India that sends surplus food from restaurants, hostels, wedding halls and homes to NGOs and shelters.

Look at the photo and fill in every field. Be practical: estimate servings from visible containers and portions, and be conservative about how long food stays safe.

Donor's text so far (may be empty):
title: ${JSON.stringify(body.title ?? "")}
description: ${JSON.stringify(body.description ?? "")}
servings claimed: ${body.quantity ?? "not given"}`

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  })

function validate(body: unknown): AnalyzeRequestBody | string {
  if (!body || typeof body !== "object") return "Request body must be JSON."
  const b = body as Partial<AnalyzeRequestBody>
  if (typeof b.imageBase64 !== "string" || b.imageBase64.length === 0) return "imageBase64 is required."
  if (b.imageBase64.length > MAX_IMAGE_BASE64_CHARS) return "Image is too large. Use a photo under 3 MB."
  if (!ALLOWED_MEDIA_TYPES.includes(b.mediaType as AnalyzeRequestBody["mediaType"])) {
    return "Unsupported image type. Use JPEG, PNG or WebP."
  }
  return {
    imageBase64: b.imageBase64,
    mediaType: b.mediaType as AnalyzeRequestBody["mediaType"],
    title: typeof b.title === "string" ? b.title.slice(0, 200) : undefined,
    description: typeof b.description === "string" ? b.description.slice(0, 1000) : undefined,
    quantity: typeof b.quantity === "number" ? b.quantity : undefined,
  }
}

export async function analyzeFood(body: AnalyzeRequestBody, env: Env): Promise<FoodAnalysis> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const response = await client.beta.messages.parse({
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 4000,
    // If a safety classifier declines, Anthropic re-runs on its recommended fallback model
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low", // simple visual classification: fast and cheap
      format: betaZodOutputFormat(FoodAnalysisSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: body.mediaType, data: body.imageBase64 },
          },
          { type: "text", text: PROMPT(body) },
        ],
      },
    ],
  })

  if (response.stop_reason === "refusal") {
    throw new AnalysisError(422, "The AI declined to analyse this image.")
  }
  if (!response.parsed_output) {
    throw new AnalysisError(502, "The AI response could not be read. Try again.")
  }

  const result = response.parsed_output
  return {
    ...result,
    suggestedTitle: result.suggestedTitle.slice(0, 80),
    estimatedServings: Math.max(0, Math.round(result.estimatedServings)),
    safeHours: Math.min(72, Math.max(1, Math.round(result.safeHours))),
  }
}

class AnalysisError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// HTTP entry point shared by the Netlify Function and the Vite dev server
export async function handleAnalyzeRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json(405, { error: "Use POST." })

  if (!env.ANTHROPIC_API_KEY) {
    return json(503, {
      error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.local (dev) or Netlify environment variables.",
    })
  }

  let parsed: AnalyzeRequestBody | string
  try {
    parsed = validate(await request.json())
  } catch {
    parsed = "Request body must be JSON."
  }
  if (typeof parsed === "string") return json(400, { error: parsed })

  try {
    const analysis = await analyzeFood(parsed, env)
    return json(200, { analysis })
  } catch (error) {
    if (error instanceof AnalysisError) return json(error.status, { error: error.message })
    if (error instanceof Anthropic.AuthenticationError) {
      return json(503, { error: "The Anthropic API key is invalid." })
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json(429, { error: "AI is busy. Wait a few seconds and try again." })
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Anthropic bad request:", error.message)
      return json(400, { error: "The AI could not process this image." })
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message)
      return json(502, { error: "AI service error. Try again." })
    }
    console.error("Analyze failed:", error)
    return json(500, { error: "Something went wrong analysing the photo." })
  }
}

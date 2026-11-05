import type { FoodAnalysis } from "../types"

export class AiUnavailableError extends Error {}

// Calls our own server endpoint (never Anthropic directly: the key stays server-side)
export async function analyzeFoodPhoto(input: {
  base64: string
  mediaType: string
  title?: string
  description?: string
  quantity?: number
}): Promise<FoodAnalysis> {
  let response: Response
  try {
    response = await fetch("/api/analyze-food", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        imageBase64: input.base64,
        mediaType: input.mediaType,
        title: input.title,
        description: input.description,
        quantity: input.quantity,
      }),
    })
  } catch {
    throw new AiUnavailableError("Couldn't reach the AI service. Check your connection.")
  }

  const data = (await response.json().catch(() => ({}))) as {
    analysis?: FoodAnalysis
    error?: string
  }

  if (!response.ok || !data.analysis) {
    const message = data.error ?? `AI request failed (${response.status}).`
    // 503 = no API key configured: the form still works without AI
    if (response.status === 503 || response.status === 404) {
      throw new AiUnavailableError(message)
    }
    throw new Error(message)
  }

  return data.analysis
}

// Current temperature + humidity at the pickup spot, from Open-Meteo
// (free, no API key). Used to make the AI's "safe until" estimate
// climate-aware: cooked food spoils much faster at 35°C than at 20°C.

export interface Weather {
  tempC: number
  humidity: number
  source: "Open-Meteo"
}

export function validCoords(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" && typeof lng === "number" &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  )
}

export async function currentWeather(lat: number, lng: number): Promise<Weather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&current=temperature_2m,relative_humidity_2m`
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!response.ok) return null
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number }
    }
    const tempC = data.current?.temperature_2m
    const humidity = data.current?.relative_humidity_2m
    if (typeof tempC !== "number" || typeof humidity !== "number") return null
    return { tempC: Math.round(tempC), humidity: Math.round(humidity), source: "Open-Meteo" }
  } catch {
    return null // weather is a bonus: never block the analysis on it
  }
}

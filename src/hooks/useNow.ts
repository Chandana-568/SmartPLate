import { useEffect, useState } from "react"

// Longest pickup window a donor may set
export const MAX_PICKUP_HOURS = 5

// One shared 1-second clock for every countdown on the page
const listeners = new Set<(now: number) => void>()
let interval: ReturnType<typeof setInterval> | null = null

export function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    listeners.add(setNow)
    if (!interval) interval = setInterval(() => listeners.forEach((fn) => fn(Date.now())), 1000)
    return () => {
      listeners.delete(setNow)
      if (listeners.size === 0 && interval) {
        clearInterval(interval)
        interval = null
      }
    }
  }, [])
  return now
}

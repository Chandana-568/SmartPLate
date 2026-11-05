import { useEffect, useState } from "react"

// Current time that re-renders every `intervalMs`, so countdowns stay live.
// All components share one timer.
const listeners = new Set<(now: number) => void>()
let timer: ReturnType<typeof setInterval> | null = null

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    listeners.add(setNow)
    if (!timer) {
      timer = setInterval(() => {
        const t = Date.now()
        listeners.forEach((fn) => fn(t))
      }, intervalMs)
    }
    return () => {
      listeners.delete(setNow)
      if (listeners.size === 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }, [intervalMs])

  return now
}

import { auth } from "../firebase"

export type NotifyEvent = "posted" | "claimed" | "assigned" | "picked-up" | "completed"

// Asks the server to send WhatsApp updates to NGOs. Best effort: failures are
// logged and never block the rescue itself.
export function notifyNgos(event: NotifyEvent, donationId: string) {
  void (async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ event, donationId }),
      })
      if (!response.ok && response.status !== 503) {
        console.warn("WhatsApp notify:", response.status, await response.text())
      }
    } catch (error) {
      console.warn("WhatsApp notify failed:", error)
    }
  })()
}

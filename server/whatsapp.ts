// Sends WhatsApp messages through Twilio's REST API (WhatsApp Sandbox works
// on a free trial). Set WHATSAPP_DRY_RUN=true to log messages instead of
// sending them (used by tests and the emulator).

type Env = Record<string, string | undefined>

// Twilio's shared sandbox number; replace with your own once approved
const SANDBOX_FROM = "+14155238886"

export interface SendResult {
  to: string
  ok: boolean
  error?: string
  dryRun?: boolean
}

export function whatsappConfigured(env: Env) {
  return env.WHATSAPP_DRY_RUN === "true" || Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN)
}

// "98765 43210" / "+91 98765-43210" / "919876543210" → "+919876543210"
export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`
  if (raw.trim().startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return null
}

export async function sendWhatsApp(env: Env, to: string, body: string): Promise<SendResult> {
  if (env.WHATSAPP_DRY_RUN === "true") {
    console.log(`[whatsapp dry-run] → ${to}\n${body}\n`)
    return { to, ok: true, dryRun: true }
  }

  const sid = env.TWILIO_ACCOUNT_SID!
  const from = env.TWILIO_WHATSAPP_FROM || SANDBOX_FROM
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${sid}:${env.TWILIO_AUTH_TOKEN}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: body }),
  })

  if (response.ok) return { to, ok: true }
  const data = (await response.json().catch(() => ({}))) as { message?: string; code?: number }
  console.error(`Twilio error ${response.status} (${data.code}) to ${maskPhone(to)}: ${data.message}`)
  return { to, ok: false, error: explainTwilioError(data.code, data.message) }
}

// "+919876543210" → "+91•••••3210" for logs
export function maskPhone(phone: string) {
  return phone.length > 7 ? `${phone.slice(0, 3)}•••••${phone.slice(-4)}` : "•••"
}

// Turns Twilio's error codes into the fix a person can do
export function explainTwilioError(code?: number, message?: string) {
  switch (code) {
    case 572002:
    case 21608:
      return "Twilio trial accounts can only message verified numbers. Add this number in Twilio → Phone Numbers → Verified Caller IDs."
    case 21654:
    case 63015:
    case 63016:
      return "This phone hasn't joined the WhatsApp sandbox (or joined over 24 h ago). Send the 'join <code>' message to +1 415 523 8886 from this phone, then try again."
    case 20003:
      return "Twilio rejected the Account SID / Auth Token."
    case 21211:
      return "That phone number isn't valid."
    default:
      return message ?? "Twilio couldn't send the message."
  }
}

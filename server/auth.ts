// Verifies the caller's Firebase ID token so only signed-in SharePlate users
// can spend the AI quota. No service account needed: Firebase ID tokens are
// JWTs signed by Google, checked here against Google's public keys.
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose"

type Env = Record<string, string | undefined>

const DEFAULT_PROJECT_ID = "shareplate-a5bf2"
const GOOGLE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
)

export class AuthError extends Error {}

export async function verifyFirebaseUser(request: Request, env: Env): Promise<string> {
  const header = request.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!token) throw new AuthError("Please log in to use AI auto-fill.")

  // Emulator tokens are unsigned and only exist on this computer
  if (env.VITE_USE_EMULATORS === "true") {
    const claims = decodeJwt(token)
    if (!claims.sub) throw new AuthError("Invalid login token.")
    return claims.sub
  }

  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID
  try {
    const { payload } = await jwtVerify(token, GOOGLE_KEYS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })
    if (!payload.sub) throw new AuthError("Invalid login token.")
    return payload.sub
  } catch (error) {
    if (error instanceof AuthError) throw error
    throw new AuthError("Your login has expired. Refresh the page and try again.")
  }
}

// Simple per-user limit. Serverless instances keep this only while warm, so
// it slows down abuse rather than guaranteeing an exact quota.
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 30
const recent = new Map<string, number[]>()

export function allowRequest(uid: string, now = Date.now()): boolean {
  const times = (recent.get(uid) ?? []).filter((t) => now - t < WINDOW_MS)
  if (times.length >= MAX_PER_WINDOW) {
    recent.set(uid, times)
    return false
  }
  times.push(now)
  recent.set(uid, times)
  return true
}

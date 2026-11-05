// Turns Firebase Auth error codes into messages a user (or a teammate
// debugging the demo) can act on.
export function authErrorMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code ?? ""

  if (code.startsWith("auth/requests-from-referer-")) {
    return (
      `This site (${window.location.origin}) is not allowed to use the Firebase API key. ` +
      "Add it under Google Cloud Console → APIs & Services → Credentials → " +
      "Browser key → Website restrictions."
    )
  }

  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email."
    case "auth/invalid-email":
      return "Please enter a valid email address."
    case "auth/weak-password":
      return "Password must be at least 6 characters."
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password."
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again."
    case "auth/network-request-failed":
      return "No connection to Firebase. Check your internet."
    case "auth/operation-not-allowed":
      return "Email/password sign-in is turned off in Firebase Authentication."
    case "auth/unauthorized-domain":
      return `Add ${window.location.hostname} to Firebase Authentication → Settings → Authorized domains.`
    default:
      return code ? `${fallback} (${code})` : fallback
  }
}

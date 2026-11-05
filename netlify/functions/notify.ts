// Netlify Function: POST /api/notify (see netlify.toml redirect)
// Needs TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Netlify environment variables.
import { handleNotifyRequest } from "../../server/notify.ts"

export default (request: Request) => handleNotifyRequest(request, process.env)

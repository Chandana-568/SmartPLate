// Netlify Function: POST /api/analyze-food (see netlify.toml redirect)
// Set ANTHROPIC_API_KEY in Netlify → Site configuration → Environment variables.
import { handleAnalyzeRequest } from "../../server/analyzeFood.ts"

export default (request: Request) => handleAnalyzeRequest(request, process.env)

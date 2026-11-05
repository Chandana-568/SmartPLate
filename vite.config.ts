import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage } from 'node:http'

// Serves /api/analyze-food during `npm run dev` with the same handler the
// Netlify Function uses. Secrets come from .env.local (never sent to the browser,
// because only VITE_* variables are exposed to client code).
function devApi(env: Record<string, string>): Plugin {
  const readBody = (req: IncomingMessage) =>
    new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })

  return {
    name: 'shareplate-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze-food', async (req, res) => {
        try {
          const { handleAnalyzeRequest } = await server.ssrLoadModule('/server/analyzeFood.ts')
          const body = req.method === 'POST' ? await readBody(req) : undefined
          const request = new Request('http://localhost/api/analyze-food', {
            method: req.method,
            headers: { 'content-type': String(req.headers['content-type'] ?? 'application/json') },
            body,
          })
          const response: Response = await handleAnalyzeRequest(request, env)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          console.error('[dev-api]', error)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Dev API crashed. See the terminal.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // '' prefix = load all variables (server-side only)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), devApi(env)],
  }
})

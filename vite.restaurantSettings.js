import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SETTINGS_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src/restaurant/settings.json')
const ROUTE = '/__triton/settings'

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/**
 * Dev-only persistence: Save writes src/restaurant/settings.json on disk.
 * The app seeds from that file, so a refresh keeps timings, users, tables and polygons.
 */
export function restaurantSettingsPlugin() {
  return {
    name: 'restaurant-settings-persist',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== ROUTE) return next()

        if (req.method === 'GET') {
          try {
            const raw = fs.readFileSync(SETTINGS_FILE, 'utf8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(raw)
          } catch (error) {
            sendJson(res, 500, { ok: false, error: String(error.message || error) })
          }
          return
        }

        if (req.method === 'PUT' || req.method === 'POST') {
          try {
            const raw = await readBody(req)
            const payload = JSON.parse(raw)
            if (!payload || typeof payload !== 'object') {
              sendJson(res, 400, { ok: false, error: 'Expected a settings JSON object' })
              return
            }
            fs.writeFileSync(SETTINGS_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
            sendJson(res, 200, { ok: true, path: 'src/restaurant/settings.json' })
          } catch (error) {
            sendJson(res, 500, { ok: false, error: String(error.message || error) })
          }
          return
        }

        sendJson(res, 405, { ok: false, error: 'Method not allowed' })
      })
    },
  }
}

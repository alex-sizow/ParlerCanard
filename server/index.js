import { createServer } from 'node:http'
import { createHmac } from 'node:crypto'

const BOT_TOKEN = process.env.BOT_TOKEN ?? '8551714620:AAHnfc4kmbzb-BNPvz2dmubz-65pOxkOBAo'
const PORT = Number(process.env.PORT ?? 3001)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '*').split(',')

/* ---------- Telegram initData validation (HMAC-SHA256) ---------- */

/**
 * Validates Telegram Mini App initData string.
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateInitData (initData) {
  if (!initData) return null

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null

  // Remove hash, sort remaining params alphabetically
  params.delete('hash')
  const entries = [...params.entries()]
  entries.sort(([a], [b]) => a.localeCompare(b))
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n')

  // HMAC_SHA256(HMAC_SHA256("WebAppData", bot_token), data_check_string)
  const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest()
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (computedHash !== hash) return null

  // Check auth_date freshness (allow up to 1 hour)
  const authDate = Number(params.get('auth_date') ?? 0)
  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > 3600) return null

  // Parse user object
  const userRaw = params.get('user')
  if (!userRaw) return null

  try {
    return JSON.parse(userRaw)
  } catch {
    return null
  }
}

/* ---------- CORS + JSON helpers ---------- */

function setCors (res, origin) {
  const allowed = ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

function json (res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function readBody (req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())) }
      catch { resolve(null) }
    })
    req.on('error', reject)
  })
}

/* ---------- HTTP Server ---------- */

const server = createServer(async (req, res) => {
  const origin = req.headers.origin ?? ''
  setCors(res, origin)

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // POST /api/validate
  if (req.method === 'POST' && req.url === '/api/validate') {
    const body = await readBody(req)
    if (!body?.initData) {
      return json(res, 400, { valid: false, error: 'Missing initData' })
    }

    const user = validateInitData(body.initData)
    if (!user) {
      return json(res, 401, { valid: false, error: 'Invalid or expired initData' })
    }

    return json(res, 200, { valid: true, user })
  }

  // Health check
  if (req.method === 'GET' && req.url === '/api/health') {
    return json(res, 200, { status: 'ok' })
  }

  json(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`[parler-server] Validation server running on :${PORT}`)
})

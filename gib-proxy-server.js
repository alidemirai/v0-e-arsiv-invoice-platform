require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const os = require('os')
const https = require('https')

const app = express()
const PORT = process.env.PORT || 3001

// HTTPS agent for SSL issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
})

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const GIB_URL = 'https://earsivportal.efatura.gov.tr'

// Login endpoint
app.post('/api/gib/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Kullanici kodu ve sifre gerekli' })
    }

    console.log(`[PROXY] Login: ${username}`)

    const params = new URLSearchParams()
    params.append('assoscmd', 'anologin')
    params.append('rtype', 'json')
    params.append('userid', username)
    params.append('sifre', password)
    params.append('sifre2', password)
    params.append('parola', '1')

    const response = await axios.post(
      `${GIB_URL}/earsiv-services/assos-login`,
      params,
      {
        httpsAgent,
        timeout: 40000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )

    console.log(`[PROXY] Login OK - Token: ${response.data.token ? 'YES' : 'NO'}`)

    if (response.data.token) {
      return res.json({ success: true, token: response.data.token })
    }

    res.json({ success: false, error: response.data.error || 'Login failed', data: response.data })
  } catch (error) {
    console.error('[PROXY] Login error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Invoices endpoint
app.post('/api/gib/invoices', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token gerekli' })
    }

    console.log('[PROXY] Invoices request')

    const params = new URLSearchParams()
    params.append('cmd', 'EARSIV_PORTAL_FATURA_LISTESI_GETIR')
    params.append('callid', require('crypto').randomUUID())
    params.append('pageName', 'RG_FATURA_LISTESI')
    params.append('token', token)
    params.append('jp', JSON.stringify({
      baslangic_tarihi: '2024-01-01',
      bitis_tarihi: new Date().toISOString().split('T')[0],
      hangi_tarafin_kayitlari: '0'
    }))

    const response = await axios.post(
      `${GIB_URL}/earsiv-services/dispatch`,
      params,
      {
        httpsAgent,
        timeout: 40000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )

    console.log('[PROXY] Invoices OK')
    res.json({ success: true, data: response.data.data || [] })
  } catch (error) {
    console.error('[PROXY] Invoices error:', error.message)
    res.json({ success: false, data: [], error: error.message })
  }
})

// Expenses endpoint
app.post('/api/gib/expenses', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token gerekli' })
    }

    console.log('[PROXY] Expenses request')

    const params = new URLSearchParams()
    params.append('cmd', 'EARSIV_PORTAL_GELEN_FATURA_LISTESI_GETIR')
    params.append('callid', require('crypto').randomUUID())
    params.append('pageName', 'RG_GELEN_FATURALAR')
    params.append('token', token)
    params.append('jp', JSON.stringify({
      baslangic_tarihi: '2024-01-01',
      bitis_tarihi: new Date().toISOString().split('T')[0],
      hangi_tarafin_kayitlari: '0'
    }))

    const response = await axios.post(
      `${GIB_URL}/earsiv-services/dispatch`,
      params,
      {
        httpsAgent,
        timeout: 40000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )

    console.log('[PROXY] Expenses OK')
    res.json({ success: true, data: response.data.data || [] })
  } catch (error) {
    console.error('[PROXY] Expenses error:', error.message)
    res.json({ success: false, data: [], error: error.message })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP()
  console.log(`\n╔════════════════════════════════════════════╗`)
  console.log(`║  GIB PROXY RUNNING                         ║`)
  console.log(`║  http://${localIP}:${PORT}`)
  console.log(`╚════════════════════════════════════════════╝\n`)
})

process.on('uncaughtException', (error) => {
  console.error('[PROXY] Error:', error)
})

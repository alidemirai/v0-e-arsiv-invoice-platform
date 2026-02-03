// GIB Proxy Server - Kendi PC'ninde çalıştır
// Kurulum: npm install express cors axios dotenv
// Çalıştırma: node gib-proxy-server.js

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const GIB_URL = 'https://earsivportal.efatura.gov.tr'

// Store tokens in memory (for this session)
const sessions = new Map()

// Proxy endpoint for GIB login
app.post('/api/gib/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Kullanici kodu ve sifre gerekli'
      })
    }

    console.log(`[PROXY] Login attempt for user: ${username}`)

    const response = await axios.post(
      `${GIB_URL}/earsiv-services/assos-login`,
      new URLSearchParams({
        assoscmd: 'anologin',
        rtype: 'json',
        userid: username,
        sifre: password,
        sifre2: password,
        parola: '1'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    )

    const data = response.data
    console.log('[PROXY] GIB Response received')

    if (data.token) {
      console.log('[PROXY] Token acquired successfully')
      sessions.set(username, { token: data.token, createdAt: Date.now() })
      return res.json({
        success: true,
        token: data.token
      })
    }

    if (data.error) {
      const errorMsg = data.error === '1' 
        ? 'Kullanici kodu veya sifre hatali'
        : `GIB Hatasi: ${data.error}`
      return res.status(401).json({
        success: false,
        error: errorMsg
      })
    }

    res.status(400).json({
      success: false,
      error: 'GIB\'den yanit alinamadi'
    })
  } catch (error) {
    console.error('[PROXY] Login error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Proxy hatasi'
    })
  }
})

// Get invoices from GIB
app.post('/api/gib/invoices', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token gerekli'
      })
    }

    console.log('[PROXY] Fetching invoices...')

    const response = await axios.post(
      `${GIB_URL}/earsiv-services/dispatch`,
      new URLSearchParams({
        cmd: 'EARSIV_PORTAL_FATURA_LISTESI_GETIR',
        callid: require('crypto').randomUUID(),
        pageName: 'RG_FATURA_LISTESI',
        token,
        jp: JSON.stringify({
          baslangic_tarihi: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          bitis_tarihi: new Date().toISOString().split('T')[0],
          hangi_tarafin_kayitlari: '0',
          earsiv_portal_onaylanan_fatura_listesi: ''
        })
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    )

    console.log('[PROXY] Invoices response:', response.data)
    res.json(response.data)
  } catch (error) {
    console.error('[PROXY] Invoices fetch error:', error.message)
    res.json({
      success: false,
      data: [],
      error: error.message
    })
  }
})

// Get expenses from GIB
app.post('/api/gib/expenses', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token gerekli'
      })
    }

    console.log('[PROXY] Fetching expenses...')

    const response = await axios.post(
      `${GIB_URL}/earsiv-services/dispatch`,
      new URLSearchParams({
        cmd: 'EARSIV_PORTAL_GELEN_FATURA_LISTESI_GETIR',
        callid: require('crypto').randomUUID(),
        pageName: 'RG_GELEN_FATURALAR',
        token,
        jp: JSON.stringify({
          baslangic_tarihi: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          bitis_tarihi: new Date().toISOString().split('T')[0],
          hangi_tarafin_kayitlari: '0'
        })
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    )

    console.log('[PROXY] Expenses response:', response.data)
    res.json(response.data)
  } catch (error) {
    console.error('[PROXY] Expenses fetch error:', error.message)
    res.json({
      success: false,
      data: [],
      error: error.message
    })
  }
})

// Generic dispatch endpoint
app.post('/api/gib/dispatch', async (req, res) => {
  try {
    const { token, cmd, pageName, jp } = req.body

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token gerekli'
      })
    }

    console.log(`[PROXY] Dispatch request: ${cmd}`)

    const response = await axios.post(
      `${GIB_URL}/earsiv-services/dispatch`,
      new URLSearchParams({
        cmd,
        callid: require('crypto').randomUUID(),
        pageName,
        token,
        jp: JSON.stringify(jp || {})
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error('[PROXY] Dispatch error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Dispatch hatasi'
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get local IP address
function getLocalIP() {
  const os = require('os')
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

// Listen on all interfaces (0.0.0.0) so it's accessible from browser
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP()
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         GIB Proxy Server Baslatildi                   ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  ONEMLI: Asagidaki URL'yi v0 uygulamasina girin:      ║
║                                                       ║
║  >>> http://${localIP}:${PORT} <<<                    ║
║                                                       ║
║  Localhost: http://localhost:${PORT}                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `)
})

// Error handling
process.on('uncaughtException', (error) => {
  console.error('[PROXY] Uncaught error:', error)
})

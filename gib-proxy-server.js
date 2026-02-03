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
    console.error('[PROXY] Error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Proxy hatasi'
    })
  }
})

// Proxy endpoint for GIB dispatch (data fetch)
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

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     GIB Proxy Server Baslatildi             ║
║                                            ║
║  Sunucu: http://localhost:${PORT}          ║
║                                            ║
║  Telefon/Tabletten baglanti icin:          ║
║  http://[PC-IP]:${PORT}                    ║
║                                            ║
║  PC IP'nizi ogrenmek icin:                 ║
║  Windows: ipconfig (IPv4 Address)          ║
║  Mac/Linux: ifconfig (inet)                ║
╚════════════════════════════════════════════╝
  `)
})

// Error handling
process.on('uncaughtException', (error) => {
  console.error('[PROXY] Uncaught error:', error)
})

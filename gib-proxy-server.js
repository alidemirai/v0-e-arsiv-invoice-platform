require('dotenv').config()
const express = require('express')
const cors = require('cors')
const os = require('os')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mock data
const MOCK_INVOICES = [
  {
    ettn: 'INV-001',
    belgeNumarasi: 'FAT-2024-001',
    belgeTarihi: '2024-01-15',
    aliciUnvanAdSoyad: 'ABC Şirketi',
    malHizmetToplamTutari: '1000.00',
    hesaplananKdv: '180.00'
  },
  {
    ettn: 'INV-002',
    belgeNumarasi: 'FAT-2024-002',
    belgeTarihi: '2024-02-10',
    aliciUnvanAdSoyad: 'XYZ Ltd',
    malHizmetToplamTutari: '2500.00',
    hesaplananKdv: '450.00'
  },
  {
    ettn: 'INV-003',
    belgeNumarasi: 'FAT-2024-003',
    belgeTarihi: '2024-02-20',
    aliciUnvanAdSoyad: 'Teknoloji A.Ş.',
    malHizmetToplamTutari: '5000.00',
    hesaplananKdv: '900.00'
  }
]

const MOCK_EXPENSES = [
  {
    ettn: 'EXP-001',
    belgeTarihi: '2024-01-05',
    saticiUnvanAdSoyad: 'Ofis Malzemeleri A.Ş.',
    malHizmetToplamTutari: '500.00'
  },
  {
    ettn: 'EXP-002',
    belgeTarihi: '2024-02-12',
    saticiUnvanAdSoyad: 'Teknoloji Çözümleri Ltd',
    malHizmetToplamTutari: '1500.00'
  },
  {
    ettn: 'EXP-003',
    belgeTarihi: '2024-02-18',
    saticiUnvanAdSoyad: 'Elektrik Tedarikçisi',
    malHizmetToplamTutari: '2000.00'
  }
]

// Login
app.post('/api/gib/login', (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Kullanici kodu ve sifre gerekli' })
    }

    console.log(`[PROXY] Login: ${username}`)
    const token = 'mock_token_' + Math.random().toString(36).substr(2, 20)
    
    res.json({ success: true, token })
  } catch (error) {
    console.error('[PROXY] Login error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Invoices
app.post('/api/gib/invoices', (req, res) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token gerekli' })
    }

    console.log('[PROXY] Invoices request')
    res.json({ success: true, data: MOCK_INVOICES })
  } catch (error) {
    console.error('[PROXY] Invoices error:', error.message)
    res.json({ success: false, data: [], error: error.message })
  }
})

// Expenses
app.post('/api/gib/expenses', (req, res) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token gerekli' })
    }

    console.log('[PROXY] Expenses request')
    res.json({ success: true, data: MOCK_EXPENSES })
  } catch (error) {
    console.error('[PROXY] Expenses error:', error.message)
    res.json({ success: false, data: [], error: error.message })
  }
})

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'mock' })
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
  console.log(`
╔════════════════════════════════════════════╗
║  GIB PROXY RUNNING (MOCK MODE)             ║
║  URL: http://${localIP}:${PORT}            ║
╚════════════════════════════════════════════╝
  `)
})

process.on('uncaughtException', (error) => {
  console.error('[PROXY] Error:', error)
})

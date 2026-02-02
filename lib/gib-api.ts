// GIB e-Arsiv Portal API
// Exact implementation based on: https://github.com/f/fatura

const GIB_TEST_URL = 'https://earsivportaltest.efatura.gov.tr'
const GIB_PROD_URL = 'https://earsivportal.efatura.gov.tr'

function getBaseUrl(env: 'test' | 'production') {
  return env === 'test' ? GIB_TEST_URL : GIB_PROD_URL
}

interface GIBCredentials {
  username: string
  password: string
  environment: 'test' | 'production'
}

// Login to GIB e-Arsiv Portal
export async function getGIBToken(credentials: GIBCredentials): Promise<{ success: boolean; token?: string; error?: string }> {
  const baseUrl = getBaseUrl(credentials.environment)
  const loginUrl = `${baseUrl}/earsiv-services/assos-login`
  
  // Test environment uses 'login', production uses 'anologin'
  const cmd = credentials.environment === 'test' ? 'login' : 'anologin'
  
  // Build request body exactly like f/fatura
  const body = new URLSearchParams({
    assoscmd: cmd,
    rtype: 'json',
    userid: credentials.username,
    sifre: credentials.password,
    sifre2: credentials.password,
    parola: '1'
  }).toString()

  console.log('[GIB-API] Login request:', { url: loginUrl, cmd, user: credentials.username })

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body,
      cache: 'no-store'
    })

    console.log('[GIB-API] Response status:', response.status, response.statusText)
    
    const text = await response.text()
    console.log('[GIB-API] Raw response:', text)

    // Check for network/server errors
    if (!response.ok) {
      return { success: false, error: `GIB sunucu hatasi: ${response.status} - ${response.statusText}`, debug: text }
    }

    // Parse response
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      console.error('[GIB-API] JSON parse failed, raw:', text)
      // Sometimes GIB returns HTML error page
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        return { success: false, error: 'GIB sunucusu erisime kapali. Lutfen daha sonra tekrar deneyin.', debug: 'HTML response received' }
      }
      return { success: false, error: 'GIB yaniti okunamadi', debug: text.substring(0, 200) }
    }

    console.log('[GIB-API] Parsed response:', JSON.stringify(data))

    // Check for token - SUCCESS CASE
    if (data.token) {
      console.log('[GIB-API] SUCCESS - Token received!')
      return { success: true, token: data.token }
    }

    // Handle errors with full debug info
    if (data.error !== undefined) {
      const errorCode = String(data.error)
      console.log('[GIB-API] Error from GIB:', errorCode, 'Full data:', JSON.stringify(data))
      
      // Map error codes
      const errorMessages: Record<string, string> = {
        '1': 'Kullanici kodu veya sifre hatali',
        '2': 'Oturum suresi doldu',
        '3': 'Yetkisiz erisim',
        '4': 'Gecersiz istek',
        '5': 'Sunucu hatasi'
      }
      
      const msg = errorMessages[errorCode] || `GIB Hata Kodu: ${errorCode}`
      return { success: false, error: msg, debug: JSON.stringify(data) }
    }

    return { success: false, error: 'Beklenmeyen yanit', debug: JSON.stringify(data) }
  } catch (error) {
    console.error('[GIB-API] Network error:', error)
    return { success: false, error: 'GIB sunucusuna baglanilamadi. Internet baglantinizi kontrol edin.' }
  }
}

// Generic dispatch request to GIB
async function gibDispatch(
  token: string,
  environment: 'test' | 'production',
  cmd: string,
  pageName: string,
  jp: object
): Promise<any> {
  const baseUrl = getBaseUrl(environment)
  const url = `${baseUrl}/earsiv-services/dispatch`
  
  const body = new URLSearchParams({
    cmd,
    callid: crypto.randomUUID(),
    pageName,
    token,
    jp: JSON.stringify(jp)
  }).toString()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body,
    cache: 'no-store'
  })

  const text = await response.text()
  return JSON.parse(text)
}

// Parse amount from GIB response
function parseAmount(value: any): number {
  if (!value) return 0
  const str = String(value)
    .replace(/[^\d.,]/g, '')
    .replace(/\.(?=.*\.)/g, '') // Keep only last dot
    .replace(',', '.')
  return parseFloat(str) || 0
}

// Get issued invoices (Giden Faturalar)
export async function getIssuedInvoices(
  token: string,
  environment: 'test' | 'production',
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log('[GIB-API] Fetching issued invoices:', { startDate, endDate })
    
    const result = await gibDispatch(token, environment, 
      'EARSIV_PORTAL_TASLAKLARI_GETIR',
      'RG_BASITTASLAKLAR',
      { baslangic: startDate, bitis: endDate, hangiTip: '5000/30000', table: [] }
    )

    console.log('[GIB-API] Issued invoices response:', JSON.stringify(result).substring(0, 500))

    if (result.data && Array.isArray(result.data)) {
      const invoices = result.data.map((inv: any) => ({
        id: inv.ettn || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        invoiceNo: inv.belgeNumarasi || inv.ettn?.substring(0, 16) || 'N/A',
        date: inv.belgeTarihi || new Date().toLocaleDateString('tr-TR'),
        customer: inv.aliciUnvanAdSoyad || inv.aliciAdi || 'Bilinmiyor',
        vkn: inv.aliciVknTckn || '',
        amount: parseAmount(inv.mpiYok) || parseAmount(inv.toplamTutar) || parseAmount(inv.vergilerDahilToplam) || 0,
        status: inv.onayDurumu === 'Onaylandı' ? 'approved' : 'draft'
      }))
      return { success: true, data: invoices }
    }

    return { success: false, error: result.error || 'Fatura verisi alinamadi' }
  } catch (error) {
    console.error('[GIB-API] Issued invoices error:', error)
    return { success: false, error: 'Fatura sorgulama hatasi' }
  }
}

// Get received invoices (Gelen Faturalar / Giderler)
export async function getReceivedInvoices(
  token: string,
  environment: 'test' | 'production',
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log('[GIB-API] Fetching received invoices:', { startDate, endDate })
    
    const result = await gibDispatch(token, environment,
      'EARSIV_PORTAL_ADIMA_KESILEN_BELGELERI_GETIR',
      'RG_ALICI_TASLAKLAR',
      { baslangic: startDate, bitis: endDate, hangiTip: '5000/30000', table: [] }
    )

    console.log('[GIB-API] Received invoices response:', JSON.stringify(result).substring(0, 500))

    if (result.data && Array.isArray(result.data)) {
      const expenses = result.data.map((inv: any) => ({
        id: inv.ettn || `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        description: inv.saticiUnvanAdSoyad || inv.saticiAdi || 'Gider',
        date: inv.belgeTarihi || new Date().toLocaleDateString('tr-TR'),
        amount: parseAmount(inv.mpiYok) || parseAmount(inv.toplamTutar) || parseAmount(inv.vergilerDahilToplam) || 0,
        category: 'Fatura',
        supplier: inv.saticiUnvanAdSoyad || inv.saticiAdi || 'Bilinmiyor',
        vkn: inv.saticiVknTckn || ''
      }))
      return { success: true, data: expenses }
    }

    return { success: false, error: result.error || 'Gider verisi alinamadi' }
  } catch (error) {
    console.error('[GIB-API] Received invoices error:', error)
    return { success: false, error: 'Gider sorgulama hatasi' }
  }
}

// Get user info
export async function getUserInfo(
  token: string,
  environment: 'test' | 'production'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const result = await gibDispatch(token, environment,
      'EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR',
      'RG_KULLANICI',
      {}
    )

    if (result.data) {
      return { success: true, data: result.data }
    }
    return { success: false, error: 'Kullanici bilgisi alinamadi' }
  } catch (error) {
    console.error('[GIB-API] User info error:', error)
    return { success: false, error: 'Kullanici bilgisi hatasi' }
  }
}

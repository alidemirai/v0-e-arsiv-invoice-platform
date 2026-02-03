// GIB e-Arsiv Portal API
// Based on: https://github.com/f/fatura and official GIB documentation

const GIB_PROD_URL = 'https://earsivportal.efatura.gov.tr'

// Credential encryption utilities
export function encryptCredentials(username: string, password: string): string {
  try {
    const data = JSON.stringify({ username, password, ts: Date.now() })
    return btoa(data) // Simple base64 encoding
  } catch {
    return ''
  }
}

export function decryptCredentials(encrypted: string): { username: string; password: string } | null {
  try {
    const data = JSON.parse(atob(encrypted))
    return { username: data.username, password: data.password }
  } catch {
    return null
  }
}

// Save credentials for offline use
export function saveGIBCredentials(username: string, password: string, token: string) {
  try {
    const sessionData = {
      username,
      password,
      token,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    }
    localStorage.setItem('gib-session', JSON.stringify(sessionData))
  } catch (e) {
    console.log('[v0] Could not save credentials')
  }
}

export function getGIBSession(): { username: string; password: string; token: string } | null {
  try {
    const stored = localStorage.getItem('gib-session')
    if (!stored) return null
    
    const session = JSON.parse(stored)
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem('gib-session')
      return null
    }
    
    return { 
      username: session.username, 
      password: session.password, 
      token: session.token 
    }
  } catch {
    return null
  }
}

export function clearGIBSession() {
  try {
    localStorage.removeItem('gib-session')
  } catch {}
}

interface GIBCredentials {
  username: string
  password: string
  environment: 'test' | 'production'
}

// Login to GIB e-Arsiv Portal
export async function getGIBToken(credentials: GIBCredentials): Promise<{ success: boolean; token?: string; error?: string }> {
  const baseUrl = getBaseUrl(credentials.environment)
  
  // Production uses different login endpoint
  const isProduction = credentials.environment === 'production'
  const loginUrl = isProduction 
    ? `${baseUrl}/earsiv-services/assos-login`
    : `${baseUrl}/earsiv-services/assos-login`
  
  // Build request body - production uses 'anologin', test uses 'login'
  const cmd = isProduction ? 'anologin' : 'login'
  
  const bodyParams: Record<string, string> = {
    assoscmd: cmd,
    rtype: 'json',
    userid: credentials.username,
    sifre: credentials.password,
    sifre2: credentials.password,
    parola: '1'
  }
  
  const body = new URLSearchParams(bodyParams).toString()

  console.log('[GIB-API] Login attempt:', { 
    url: loginUrl, 
    cmd, 
    user: credentials.username,
    env: credentials.environment 
  })

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': baseUrl,
        'Referer': `${baseUrl}/intragiris.html`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body,
      cache: 'no-store'
    })

    const text = await response.text()
    console.log('[GIB-API] Raw response:', text.substring(0, 500))

    // Parse response
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      // Sometimes GIB returns HTML on error
      if (text.includes('DOCTYPE') || text.includes('<html')) {
        console.error('[GIB-API] Received HTML instead of JSON - likely CORS or redirect issue')
        return { 
          success: false, 
          error: 'GIB sunucusu HTML yaniti dondu. Bu genellikle CORS sorunu veya yanlis endpoint anlamina gelir.' 
        }
      }
      console.error('[GIB-API] Failed to parse response as JSON:', text.substring(0, 200))
      return { success: false, error: 'GIB yaniti JSON olarak okunamadi' }
    }

    console.log('[GIB-API] Parsed response:', JSON.stringify(data).substring(0, 300))

    // Check for token in various possible locations
    const token = data.token || data.Token || data.sessionToken
    if (token) {
      console.log('[GIB-API] Token received successfully')
      return { success: true, token }
    }

    // Handle error responses
    if (data.error) {
      const errorCode = String(data.error)
      console.log('[GIB-API] Error received:', errorCode)
      
      // Map known error codes
      const errorMessages: Record<string, string> = {
        '1': 'Kullanici kodu veya sifre hatali. Interaktif Vergi Dairesi bilgilerinizi kontrol edin.',
        '2': 'Oturum suresi doldu. Tekrar giris yapin.',
        '3': 'Hesabiniz kilitlenmis olabilir. Lutfen ivd.gib.gov.tr uzerinden kontrol edin.',
        '4': 'Sistem bakimda. Lutfen daha sonra tekrar deneyin.'
      }
      
      const errorMsg = errorMessages[errorCode] || 
        (errorCode.toLowerCase().includes('hatal') ? errorMessages['1'] : `GIB Hatasi: ${errorCode}`)
      
      return { success: false, error: errorMsg }
    }

    // No token and no error - unexpected response
    return { 
      success: false, 
      error: 'GIB\'den beklenmeyen yanit alindi. Lutfen bilgilerinizi kontrol edin.' 
    }
  } catch (error) {
    console.error('[GIB-API] Network error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    
    // Check for common network errors
    if (errorMessage.includes('CORS') || errorMessage.includes('blocked')) {
      return { 
        success: false, 
        error: 'CORS hatasi: GIB sunucusu bu istegi engelledi. Sunucu tarafli proxy gerekiyor.' 
      }
    }
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return { 
        success: false, 
        error: 'GIB sunucusuna baglanilamadi. Internet baglantinizi kontrol edin.' 
      }
    }
    
    return { success: false, error: `Baglanti hatasi: ${errorMessage}` }
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

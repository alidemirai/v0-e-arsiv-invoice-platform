'use server'

// GIB e-Arsiv Portal API - Real Implementation
// Based on: https://github.com/f/fatura

const GIB_ENDPOINTS = {
  test: 'https://earsivportaltest.efatura.gov.tr',
  production: 'https://earsivportal.efatura.gov.tr'
}

interface GIBCredentials {
  username: string
  password: string
  environment: 'test' | 'production'
}

interface GIBSession {
  token: string
  environment: 'test' | 'production'
}

// Get authentication token from GIB
export async function getGIBToken(credentials: GIBCredentials): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const baseUrl = GIB_ENDPOINTS[credentials.environment]
    const loginUrl = `${baseUrl}/earsiv-services/assos-login`
    
    // Use correct command based on environment
    // "anologin" for production, "login" for test
    const assoscmd = credentials.environment === 'production' ? 'anologin' : 'login'
    
    const params = new URLSearchParams({
      assoscmd,
      rtype: 'json',
      userid: credentials.username,
      sifre: credentials.password,
      sifre2: credentials.password,
      parola: '1'
    })
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': `${baseUrl}/intragiris.html`
      },
      body: params.toString()
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const responseText = await response.text()
    
    // Try JSON parsing first (expected format)
    try {
      const jsonData = JSON.parse(responseText)
      if (jsonData.token) {
        return { success: true, token: jsonData.token }
      }
      if (jsonData.error) {
        return { success: false, error: jsonData.error }
      }
      if (jsonData.userid && !jsonData.token) {
        return { success: false, error: 'Kullanici adi veya sifre hatali' }
      }
    } catch {
      // Not JSON, try form-encoded
      const urlParams = new URLSearchParams(responseText)
      const token = urlParams.get('token')
      if (token) {
        return { success: true, token }
      }
      const error = urlParams.get('error') || urlParams.get('hata')
      if (error) {
        return { success: false, error }
      }
    }

    return { success: false, error: 'Token alinamadi. Kullanici adi veya sifre hatali olabilir.' }
  } catch (error) {
    console.error('[GIB] Auth error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Baglanti hatasi' }
  }
}

// Fetch invoices issued by user
export async function getIssuedInvoices(
  token: string, 
  environment: 'test' | 'production',
  startDate: string, 
  endDate: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const baseUrl = GIB_ENDPOINTS[environment]
    const url = `${baseUrl}/earsiv-services/dispatch`
    
    const params = new URLSearchParams({
      cmd: 'EARSIV_PORTAL_TASLAKLARI_GETIR',
      callid: crypto.randomUUID(),
      pageName: 'RG_BASITTASLAKLAR',
      token,
      jp: JSON.stringify({
        baslangic: startDate,
        bitis: endDate,
        hangiTip: '5000/30000',
        table: []
      })
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': `${baseUrl}/intragiris.html`
      },
      body: params.toString()
    })

    const responseText = await response.text()
    
    // Try to parse as JSON
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      return { success: false, error: 'Yanit parse edilemedi: ' + responseText.substring(0, 100) }
    }
    
    if (data.data && Array.isArray(data.data)) {
      const invoices = data.data.map((inv: any) => ({
        id: inv.ettn || inv.uuid || `INV-${Date.now()}`,
        invoiceNo: inv.belgeNumarasi || inv.belgeNo || inv.ettn?.substring(0, 16) || 'N/A',
        date: inv.belgeTarihi || inv.faturaTarihi || new Date().toLocaleDateString('tr-TR'),
        customer: inv.aliciUnvanAdSoyad || inv.aliciAdi || 'Bilinmeyen',
        vkn: inv.aliciVknTckn || inv.vkn || '',
        amount: parseFloat(String(inv.toplamTutar || inv.mpiYok || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        status: (inv.onayDurumu === 'Onaylandı' || inv.onayDurumu === 'Onaylanmadı') ? 'approved' : 'pending',
        source: 'gib' as const
      }))
      return { success: true, data: invoices }
    }

    return { success: false, error: data.error || 'Fatura verisi alinamadi' }
  } catch (error) {
    console.error('[GIB] Invoice fetch error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Baglanti hatasi' }
  }
}

// Fetch invoices issued TO the user (incoming)
export async function getReceivedInvoices(
  token: string,
  environment: 'test' | 'production', 
  startDate: string, 
  endDate: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const baseUrl = GIB_ENDPOINTS[environment]
    const url = `${baseUrl}/earsiv-services/dispatch`
    
    const params = new URLSearchParams({
      cmd: 'EARSIV_PORTAL_ADIMA_KESILEN_BELGELERI_GETIR',
      callid: crypto.randomUUID(),
      pageName: 'RG_ALICI_TASLAKLAR',
      token,
      jp: JSON.stringify({
        baslangic: startDate,
        bitis: endDate
      })
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': `${baseUrl}/intragiris.html`
      },
      body: params.toString()
    })

    const responseText = await response.text()
    
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      return { success: false, error: 'Yanit parse edilemedi' }
    }
    
    if (data.data && Array.isArray(data.data)) {
      const expenses = data.data.map((inv: any) => ({
        id: inv.ettn || inv.uuid || `EXP-${Date.now()}`,
        description: inv.saticiUnvanAdSoyad || inv.saticiAdi || 'Gider',
        date: inv.belgeTarihi || inv.faturaTarihi || new Date().toLocaleDateString('tr-TR'),
        amount: parseFloat(String(inv.toplamTutar || inv.mpiYok || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        category: 'Fatura',
        supplier: inv.saticiUnvanAdSoyad || inv.saticiAdi || 'Bilinmeyen',
        vkn: inv.saticiVknTckn || inv.vkn || '',
        source: 'gib' as const
      }))
      return { success: true, data: expenses }
    }

    return { success: false, error: data.error || 'Gider verisi alinamadi' }
  } catch (error) {
    console.error('[GIB] Expense fetch error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Baglanti hatasi' }
  }
}

// Get user information
export async function getUserInfo(
  token: string,
  environment: 'test' | 'production'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const baseUrl = GIB_ENDPOINTS[environment]
    const url = `${baseUrl}/earsiv-services/dispatch`
    
    const params = new URLSearchParams({
      cmd: 'EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR',
      callid: crypto.randomUUID(),
      pageName: 'RG_KULLANICI',
      token,
      jp: '{}'
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': `${baseUrl}/intragiris.html`
      },
      body: params.toString()
    })

    const responseText = await response.text()
    
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      return { success: false, error: 'Yanit parse edilemedi' }
    }
    
    if (data?.data) {
      return { success: true, data: data.data }
    }

    return { success: false, error: 'Kullanici bilgisi alinamadi' }
  } catch (error) {
    console.error('[GIB] User info error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Baglanti hatasi' }
  }
}

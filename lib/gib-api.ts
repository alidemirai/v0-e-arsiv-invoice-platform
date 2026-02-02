'use server'

// GIB e-Arsiv Portal API - Real Implementation
// Based on: https://github.com/f/fatura

const GIB_ENDPOINTS = {
  test: 'https://earsivportaltest.efatura.gov.tr',
  production: 'https://earsivportal.efatura.gov.tr'
}

interface GIBCredentials {
  vkn: string
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
    
    // Step 1: Get the main page to establish session
    const loginUrl = `${baseUrl}/earsiv-services/assos-login`
    
    const params = new URLSearchParams({
      assession: 'v',
      userid: credentials.username,
      session: 'Y',
      sifre: credentials.password,
      paression: '1',
    })
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: params.toString()
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const data = await response.json()
    
    if (data.token) {
      return { success: true, token: data.token }
    }
    
    if (data.error) {
      return { success: false, error: data.error }
    }

    return { success: false, error: 'Token alinamadi' }
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
    const url = `${baseUrl}/earsiv-services/irsaliye`
    
    const params = new URLSearchParams({
      cmd: 'EARSIV_PORTAL_TASLAKLARI_GETIR',
      callid: Date.now().toString(),
      token,
      jp: JSON.stringify({
        baslangic: startDate,
        bitis: endDate,
        hangiTip: '5000/30000', // Satış faturaları
        table: []
      })
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })

    const data = await response.json()
    
    if (data.data) {
      const invoices = data.data.map((inv: any) => ({
        id: inv.ettn,
        invoiceNo: inv.belgeNumarasi || inv.ettn?.substring(0, 16),
        date: inv.belgeTarihi,
        customer: inv.aliciUnvanAdSoyad || 'Bilinmeyen',
        vkn: inv.aliciVknTckn,
        amount: parseFloat(inv.mpiYok?.split(' ')[0] || '0'),
        status: inv.onayDurumu === 'Onaylandı' ? 'approved' : 'pending',
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
    const url = `${baseUrl}/earsiv-services/irsaliye`
    
    const params = new URLSearchParams({
      cmd: 'EARSIV_PORTAL_ADIMA_KESILEN_BELGELERI_GETIR',
      callid: Date.now().toString(),
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
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })

    const data = await response.json()
    
    if (data.data) {
      const expenses = data.data.map((inv: any) => ({
        id: inv.ettn,
        description: inv.saticiUnvanAdSoyad || 'Gider',
        date: inv.belgeTarihi,
        amount: parseFloat(inv.mpiYok?.split(' ')[0] || '0'),
        category: 'Fatura',
        supplier: inv.saticiUnvanAdSoyad,
        vkn: inv.saticiVknTckn,
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
    const url = `${baseUrl}/earsiv-services/irsaliye`
    
    const params = new URLSearchParams({
      cmd: 'EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR',
      callid: Date.now().toString(),
      token,
      jp: '{}'
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })

    const data = await response.json()
    
    if (data.data) {
      return { success: true, data: data.data }
    }

    return { success: false, error: 'Kullanici bilgisi alinamadi' }
  } catch (error) {
    console.error('[GIB] User info error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Baglanti hatasi' }
  }
}

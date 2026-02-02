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

// Get authentication token from GIB
export async function getGIBToken(credentials: GIBCredentials): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const baseUrl = GIB_ENDPOINTS[credentials.environment]
    const loginUrl = `${baseUrl}/earsiv-services/assos-login`
    
    // Use correct command based on environment
    const assoscmd = credentials.environment === 'production' ? 'anologin' : 'login'
    
    // Build form data using URLSearchParams for proper encoding
    const formData = new URLSearchParams()
    formData.append('assoscmd', assoscmd)
    formData.append('rtype', 'json')
    formData.append('userid', credentials.username)
    formData.append('sifre', credentials.password)
    formData.append('sifre2', credentials.password)
    formData.append('parola', '1')
    
    console.log('[GIB] Login attempt:', loginUrl, 'cmd:', assoscmd)
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Origin': baseUrl,
        'Referer': `${baseUrl}/intragiris.html`
      },
      body: formData.toString()
    })

    console.log('[GIB] Response status:', response.status)

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const responseText = await response.text()
    console.log('[GIB] Response:', responseText.substring(0, 300))
    
    // Try JSON parsing
    try {
      const jsonData = JSON.parse(responseText)
      if (jsonData.token) {
        console.log('[GIB] Token received!')
        return { success: true, token: jsonData.token }
      }
      if (jsonData.error) {
        return { success: false, error: jsonData.error }
      }
    } catch {
      // Try regex extraction
      const tokenMatch = responseText.match(/"token"\s*:\s*"([^"]+)"/)
      if (tokenMatch) {
        return { success: true, token: tokenMatch[1] }
      }
    }

    return { success: false, error: 'Token alinamadi. Kullanici kodu veya sifre hatali.' }
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
    
    const cmd = 'EARSIV_PORTAL_TASLAKLARI_GETIR'
    const pageName = 'RG_BASITTASLAKLAR'
    const callid = crypto.randomUUID()
    const jp = JSON.stringify({
      baslangic: startDate,
      bitis: endDate,
      hangiTip: '5000/30000',
      table: []
    })
    
    const body = `cmd=${cmd}&callid=${callid}&pageName=${pageName}&token=${token}&jp=${encodeURIComponent(jp)}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'tr,en-US;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'pragma': 'no-cache',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      },
      body
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
      const invoices = data.data.map((inv: any) => {
        // Parse amount from various possible fields
        let amount = 0
        const amountFields = [
          inv.toplamTutar,
          inv.mpiYok,
          inv.vergilerDahilToplam, 
          inv.vergilerHaricToplam,
          inv.odenecekTutar,
          inv.matrah
        ]
        
        for (const field of amountFields) {
          if (field) {
            const parsed = parseFloat(
              String(field)
                .replace(/[^\d.,]/g, '')
                .replace(/\.(?=\d{3})/g, '') // Remove thousand separators
                .replace(',', '.')
            )
            if (!isNaN(parsed) && parsed > 0) {
              amount = parsed
              break
            }
          }
        }

        return {
          id: inv.ettn || inv.uuid || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          invoiceNo: inv.belgeNumarasi || inv.belgeNo || (inv.ettn ? inv.ettn.substring(0, 16) : 'N/A'),
          date: inv.belgeTarihi || inv.faturaTarihi || new Date().toLocaleDateString('tr-TR'),
          customer: inv.aliciUnvanAdSoyad || inv.aliciAdi || inv.unpiece || 'Bilinmeyen',
          vkn: inv.aliciVknTckn || inv.vkn || '',
          amount,
          status: inv.onayDurumu === 'Onaylandı' ? 'approved' : inv.onayDurumu === 'Onaylanmadı' ? 'sent' : 'draft',
          source: 'gib' as const
        }
      })
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
    
    const cmd = 'EARSIV_PORTAL_ADIMA_KESILEN_BELGELERI_GETIR'
    const pageName = 'RG_ALICI_TASLAKLAR'
    const callid = crypto.randomUUID()
    const jp = JSON.stringify({
      baslangic: startDate,
      bitis: endDate,
      hangiTip: '5000/30000',
      table: []
    })
    
    const body = `cmd=${cmd}&callid=${callid}&pageName=${pageName}&token=${token}&jp=${encodeURIComponent(jp)}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'tr,en-US;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'pragma': 'no-cache',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      },
      body
    })

    const responseText = await response.text()
    
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      return { success: false, error: 'Yanit parse edilemedi' }
    }
    
    if (data.data && Array.isArray(data.data)) {
      const expenses = data.data.map((inv: any) => {
        // Parse amount from various possible fields
        let amount = 0
        const amountFields = [
          inv.toplamTutar,
          inv.mpiYok,
          inv.vergilerDahilToplam,
          inv.vergilerHaricToplam,
          inv.odenecekTutar,
          inv.matrah
        ]
        
        for (const field of amountFields) {
          if (field) {
            const parsed = parseFloat(
              String(field)
                .replace(/[^\d.,]/g, '')
                .replace(/\.(?=\d{3})/g, '')
                .replace(',', '.')
            )
            if (!isNaN(parsed) && parsed > 0) {
              amount = parsed
              break
            }
          }
        }

        return {
          id: inv.ettn || inv.uuid || `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: inv.saticiUnvanAdSoyad || inv.saticiAdi || 'Gider',
          date: inv.belgeTarihi || inv.faturaTarihi || new Date().toLocaleDateString('tr-TR'),
          amount,
          category: 'Fatura',
          supplier: inv.saticiUnvanAdSoyad || inv.saticiAdi || 'Bilinmeyen',
          vkn: inv.saticiVknTckn || inv.vkn || '',
          source: 'gib' as const
        }
      })
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
    
    const cmd = 'EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR'
    const pageName = 'RG_KULLANICI'
    const callid = crypto.randomUUID()
    
    const body = `cmd=${cmd}&callid=${callid}&pageName=${pageName}&token=${token}&jp=${encodeURIComponent('{}')}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'tr,en-US;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'pragma': 'no-cache',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      },
      body
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

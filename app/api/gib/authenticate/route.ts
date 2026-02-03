import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const GIB_TEST_URL = 'https://earsivportaltest.efatura.gov.tr'
const GIB_PROD_URL = 'https://earsivportal.efatura.gov.tr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, environment = 'production' } = body

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Kullanici kodu ve sifre gerekli' },
        { status: 400 }
      )
    }

    const baseUrl = environment === 'test' ? GIB_TEST_URL : GIB_PROD_URL
    const cmd = environment === 'test' ? 'login' : 'anologin'
    
    console.log('[API] GIB auth attempt:', { baseUrl, cmd, username, environment })

    // Make direct server-side request to GIB
    const loginUrl = `${baseUrl}/earsiv-services/assos-login`
    
    const bodyParams = new URLSearchParams({
      assoscmd: cmd,
      rtype: 'json',
      userid: username,
      sifre: password,
      sifre2: password,
      parola: '1'
    })

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': baseUrl,
        'Referer': `${baseUrl}/intragiris.html`
      },
      body: bodyParams.toString(),
      cache: 'no-store'
    })

    const responseText = await response.text()
    console.log('[API] GIB raw response:', responseText.substring(0, 500))

    // Try to parse JSON
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('[API] Failed to parse GIB response as JSON')
      
      // Check if HTML response (usually means server error or redirect)
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        return NextResponse.json(
          { success: false, error: 'GIB sunucusu beklenmeyen bir yanit dondu. Lutfen daha sonra tekrar deneyin.' },
          { status: 502 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'GIB yanitI okunamadi' },
        { status: 502 }
      )
    }

    console.log('[API] GIB parsed response:', JSON.stringify(data).substring(0, 300))

    // Check for token
    const token = data.token || data.Token
    if (token) {
      console.log('[API] GIB token received successfully')

      // Try to get user info
      let userInfo = null
      try {
        const userInfoResult = await fetch(`${baseUrl}/earsiv-services/dispatch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: new URLSearchParams({
            cmd: 'EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR',
            callid: crypto.randomUUID(),
            pageName: 'RG_KULLANICI',
            token: token,
            jp: '{}'
          }).toString(),
          cache: 'no-store'
        })
        const userInfoText = await userInfoResult.text()
        const userInfoData = JSON.parse(userInfoText)
        userInfo = userInfoData.data || null
      } catch (e) {
        console.log('[API] Could not fetch user info:', e)
      }

      // Store session in cookies
      const cookieStore = await cookies()
      const sessionData = {
        token,
        username,
        environment,
        userInfo,
        createdAt: Date.now()
      }

      cookieStore.set('gib-session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2 // 2 hours
      })

      return NextResponse.json({
        success: true,
        token,
        userInfo,
        message: 'GIB giris basarili'
      })
    }

    // Handle error response
    if (data.error) {
      const errorCode = String(data.error)
      console.log('[API] GIB error code:', errorCode)
      
      let errorMessage = 'GIB giris basarisiz'
      
      if (errorCode === '1' || errorCode.toLowerCase().includes('hatal')) {
        errorMessage = 'Kullanici kodu veya sifre hatali. Interaktif Vergi Dairesi bilgilerinizi kontrol edin.'
      } else if (errorCode === '2') {
        errorMessage = 'Oturum suresi doldu. Tekrar giris yapin.'
      } else if (errorCode === '3') {
        errorMessage = 'Hesabiniz kilitlenmis olabilir. ivd.gib.gov.tr uzerinden kontrol edin.'
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Token alinamadi. Bilgilerinizi kontrol edin.' },
      { status: 401 }
    )
  } catch (error) {
    console.error('[API] GIB auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Sunucu hatasi. Lutfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}

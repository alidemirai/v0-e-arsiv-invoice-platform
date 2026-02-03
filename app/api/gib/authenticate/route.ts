import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const GIB_PROD_URL = 'https://earsivportal.efatura.gov.tr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, proxyUrl } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Kullanici kodu ve sifre gerekli' },
        { status: 400 }
      )
    }

    console.log('[API] GIB auth attempt:', { username, proxyUrl: proxyUrl ? 'using proxy' : 'direct' })

    let response: Response
    let loginUrl: string

    // Try to use proxy first if available
    if (proxyUrl) {
      console.log('[API] Using proxy server:', proxyUrl)
      loginUrl = `${proxyUrl}/api/gib/login`
      
      try {
        response = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          signal: AbortSignal.timeout(5000)
        })
      } catch (e) {
        console.error('[API] Proxy error, falling back to direct connection:', e)
        // Fallback to direct connection
        return attemptDirectAuth(username, password)
      }
    } else {
      // Direct connection attempt
      return attemptDirectAuth(username, password)
    }

    const responseText = await response.text()
    console.log('[API] Response received, status:', response.status)

    let data: any
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('[API] Failed to parse response')
      return NextResponse.json(
        { success: false, error: 'Proxy yanitI okunamadi' },
        { status: 502 }
      )
    }

    if (data.success && data.token) {
      console.log('[API] Token received successfully')

      // Save session
      const cookieStore = await cookies()
      const sessionData = {
        token: data.token,
        username,
        environment: 'production',
        createdAt: Date.now()
      }

      cookieStore.set('gib-session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2
      })

      return NextResponse.json({
        success: true,
        token: data.token,
        message: 'GIB giris basarili'
      })
    }

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: data.error || 'Giris basarisiz' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Token alinamadi' },
      { status: 401 }
    )
  } catch (error) {
    console.error('[API] Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Sunucu hatasi' },
      { status: 500 }
    )
  }
}

async function attemptDirectAuth(username: string, password: string): Promise<NextResponse> {
  try {
    console.log('[API] Attempting direct connection to GIB')
    
    const response = await fetch(`${GIB_PROD_URL}/earsiv-services/assos-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: new URLSearchParams({
        assoscmd: 'anologin',
        rtype: 'json',
        userid: username,
        sifre: password,
        sifre2: password,
        parola: '1'
      }).toString(),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    })

    const text = await response.text()
    const data = JSON.parse(text)

    if (data.token) {
      const cookieStore = await cookies()
      cookieStore.set('gib-session', JSON.stringify({
        token: data.token,
        username,
        environment: 'production',
        createdAt: Date.now()
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2
      })

      return NextResponse.json({
        success: true,
        token: data.token,
        message: 'GIB giris basarili'
      })
    }

    if (data.error) {
      const errorMsg = data.error === '1' 
        ? 'Kullanici kodu veya sifre hatali'
        : `GIB Hatasi: ${data.error}`
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'GIB\'den yanit alinamadi' },
      { status: 502 }
    )
  } catch (error) {
    console.error('[API] Direct auth failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'GIB sunucusuna baglanilamadi. Yerel proxy sunucu kullanmayı deneyin.' 
      },
      { status: 502 }
    )
  }
}

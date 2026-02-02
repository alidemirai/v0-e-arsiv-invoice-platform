import { NextRequest, NextResponse } from 'next/server'
import { getGIBToken, getUserInfo } from '@/lib/gib-api'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vkn, username, password, environment = 'production' } = body

    // Validate inputs
    if (!vkn || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'VKN, kullanici adi ve sifre gerekli' },
        { status: 400 }
      )
    }

    if (vkn.length !== 10 && vkn.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'VKN 10 veya TCKN 11 haneli olmali' },
        { status: 400 }
      )
    }

    // Get real GIB token
    const result = await getGIBToken({
      vkn,
      username,
      password,
      environment: environment as 'test' | 'production'
    })

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'GIB giris basarisiz' },
        { status: 401 }
      )
    }

    // Get user info
    const userInfo = await getUserInfo(result.token, environment)

    // Store session in cookies
    const cookieStore = await cookies()
    const sessionData = {
      token: result.token,
      vkn,
      username,
      environment,
      userInfo: userInfo.data || null,
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
      token: result.token,
      userInfo: userInfo.data,
      message: 'GIB giris basarili'
    })
  } catch (error) {
    console.error('[API] GIB auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Sunucu hatasi' },
      { status: 500 }
    )
  }
}

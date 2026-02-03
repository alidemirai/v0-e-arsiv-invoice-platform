import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, proxyUrl } = body

    if (!token) {
      return NextResponse.json(
        { success: false, data: [], error: 'Token gerekli' },
        { status: 401 }
      )
    }

    const baseUrl = proxyUrl || 'http://localhost:3001'
    
    console.log('[API] Fetching invoices from proxy:', baseUrl)

    const response = await fetch(`${baseUrl}/api/gib/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(15000)
    })

    const data = await response.json()
    console.log('[API] Invoices response:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] Invoices error:', error)
    return NextResponse.json(
      { 
        success: false, 
        data: [],
        error: error instanceof Error ? error.message : 'Fatura verisi alinamamadi'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('gib-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadi' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)
    const { token } = session
    const proxyUrl = request.nextUrl.searchParams.get('proxyUrl') || 'http://localhost:3001'

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token bulunamadi' },
        { status: 401 }
      )
    }

    console.log('[API] GET Invoices - proxyUrl:', proxyUrl)

    const response = await fetch(`${proxyUrl}/api/gib/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(15000)
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] GET Invoices error:', error)
    return NextResponse.json(
      { success: false, data: [], error: 'Fatura verisi cekilemedi' },
      { status: 500 }
    )
  }
}

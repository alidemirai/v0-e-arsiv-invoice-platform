import { NextRequest, NextResponse } from 'next/server'
import { getIssuedInvoices } from '@/lib/gib-api'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('gib-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadi. Lutfen giris yapin.' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionCookie.value)
    const { token, environment } = session

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token bulunamadi' },
        { status: 401 }
      )
    }

    // Get date range from query params or default to last 3 months
    const searchParams = request.nextUrl.searchParams
    const endDate = searchParams.get('endDate') || new Date().toLocaleDateString('tr-TR')
    const startDate = searchParams.get('startDate') || (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 3)
      return d.toLocaleDateString('tr-TR')
    })()

    // Fetch real invoices from GIB
    const result = await getIssuedInvoices(token, environment, startDate, endDate)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
      count: result.data?.length || 0
    })
  } catch (error) {
    console.error('[API] Invoice fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Fatura verisi cekilemedi' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getReceivedInvoices } from '@/lib/gib-api'
import { cookies } from 'next/headers'

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
    const { token, environment } = session

    // Get date range - last 3 months
    const endDate = new Date().toLocaleDateString('tr-TR')
    const startDate = (() => {
      const d = new Date()
      d.setMonth(d.getMonth() - 3)
      return d.toLocaleDateString('tr-TR')
    })()

    const result = await getReceivedInvoices(token, environment, startDate, endDate)

    return NextResponse.json({
      success: result.success,
      data: result.data || [],
      count: result.data?.length || 0,
      error: result.error
    })
  } catch (error) {
    console.error('[API] Expense fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Gider verisi cekilemedi' },
      { status: 500 }
    )
  }
}

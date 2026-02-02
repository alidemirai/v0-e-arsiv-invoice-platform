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

    // Get date range from query params or default to current month
    const searchParams = request.nextUrl.searchParams
    
    // Format dates as DD/MM/YYYY for GIB API
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }
    
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const endDate = searchParams.get('endDate') || formatDate(now)
    const startDate = searchParams.get('startDate') || formatDate(monthStart)

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

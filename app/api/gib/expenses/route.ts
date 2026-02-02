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

    // Format dates as DD/MM/YYYY for GIB API
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }
    
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const endDate = formatDate(now)
    const startDate = formatDate(monthStart)

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

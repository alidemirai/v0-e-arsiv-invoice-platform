import { NextRequest, NextResponse } from 'next/server'

const MOCK_CUSTOMERS = [
  { id: 'C001', title: 'ABC Teknoloji Ltd. Şti.', vkn: '1234567890', taxOffice: 'Kadıköy', city: 'İstanbul', invoiceCount: 15 },
  { id: 'C002', title: 'XYZ Danışmanlık A.Ş.', vkn: '0987654321', taxOffice: 'Çankaya', city: 'Ankara', invoiceCount: 8 },
  { id: 'C003', title: 'Mega Market Perakende', vkn: '5678901234', taxOffice: 'Konak', city: 'İzmir', invoiceCount: 22 },
  { id: 'C004', title: 'Dijital Pazarlama Co.', vkn: '4321098765', taxOffice: 'Beşiktaş', city: 'İstanbul', invoiceCount: 5 },
  { id: 'C005', title: 'Yazılım Evi Ltd.', vkn: '6789012345', taxOffice: 'Nilüfer', city: 'Bursa', invoiceCount: 12 },
]

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token gerekli' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: MOCK_CUSTOMERS,
      count: MOCK_CUSTOMERS.length
    })
  } catch (error) {
    console.error('[v0] Customer fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Müşteri verisi çekiş hatası' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

const MOCK_EXPENSES = [
  { id: 'E001', description: 'Ofis Malzemeleri', amount: 1250.00, date: '2025-01-10', category: 'Ofis', supplier: 'Ofis Dünyası' },
  { id: 'E002', description: 'Yazılım Lisansı', amount: 4500.00, date: '2025-01-15', category: 'Yazılım', supplier: 'Microsoft' },
  { id: 'E003', description: 'Ulaşım Gideri', amount: 850.00, date: '2025-01-18', category: 'Ulaşım', supplier: 'Taksi' },
  { id: 'E004', description: 'Yemek Faturası', amount: 320.00, date: '2025-01-20', category: 'Yemek', supplier: 'Restoran X' },
  { id: 'E005', description: 'İnternet Faturası', amount: 750.00, date: '2025-02-01', category: 'İletişim', supplier: 'Türk Telekom' },
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
      data: MOCK_EXPENSES,
      count: MOCK_EXPENSES.length
    })
  } catch (error) {
    console.error('[v0] Expense fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Gider verisi çekiş hatası' },
      { status: 500 }
    )
  }
}

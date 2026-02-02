import { NextRequest, NextResponse } from 'next/server'

const MOCK_INVOICES = [
  { id: 'GIB001', invoiceNo: 'GIB2025000001', date: '2025-01-15', amount: 12500.00, customer: 'ABC Teknoloji Ltd. Şti.', status: 'approved', source: 'gib' },
  { id: 'GIB002', invoiceNo: 'GIB2025000002', date: '2025-01-20', amount: 8750.50, customer: 'XYZ Danışmanlık A.Ş.', status: 'approved', source: 'gib' },
  { id: 'GIB003', invoiceNo: 'GIB2025000003', date: '2025-01-25', amount: 3200.00, customer: 'Mega Market Perakende', status: 'approved', source: 'gib' },
  { id: 'GIB004', invoiceNo: 'GIB2025000004', date: '2025-02-01', amount: 15800.00, customer: 'Dijital Pazarlama Co.', status: 'pending', source: 'gib' },
  { id: 'GIB005', invoiceNo: 'GIB2025000005', date: '2025-02-05', amount: 4500.00, customer: 'Yazılım Evi Ltd.', status: 'approved', source: 'gib' },
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

    // If token is test token, return mock data
    if (token.startsWith('TEST_')) {
      return NextResponse.json({
        success: true,
        data: MOCK_INVOICES,
        count: MOCK_INVOICES.length,
        message: 'Test modunda örnek faturalar'
      })
    }

    // Real GIB API call would go here
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://tempuri.org/">
  <soap:Body>
    <tns:GetInvoiceList>
      <tns:Token>${token}</tns:Token>
      <tns:StartDate>2024-01-01</tns:StartDate>
      <tns:EndDate>2025-12-31</tns:EndDate>
      <tns:InvoiceType>31</tns:InvoiceType>
      <tns:Limit>100</tns:Limit>
      <tns:Offset>0</tns:Offset>
    </tns:GetInvoiceList>
  </soap:Body>
</soap:Envelope>`

    // For now, return mock data as fallback
    return NextResponse.json({
      success: true,
      data: MOCK_INVOICES,
      count: MOCK_INVOICES.length
    })
  } catch (error) {
    console.error('[v0] Invoice fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Fatura verisi çekiş hatası' },
      { status: 500 }
    )
  }
}

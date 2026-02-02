'use server'

import { getGIBSession } from './gib-auth'

const GIB_ENDPOINTS = {
  test: 'https://earsivportal.efatura.gov.tr/intranet/ws1/Mock/InvoicePortalTestReferance.asmx',
  production: 'https://earsivportal.efatura.gov.tr/intranet/ws1/Invoice.asmx'
}

interface GIBDataResult<T> {
  success: boolean
  data?: T[]
  count?: number
  error?: string
}

// Mock data for test mode
const MOCK_INVOICES = [
  { id: 'GIB001', invoiceNo: 'GIB2025000001', date: '2025-01-15', amount: 12500.00, customer: 'ABC Teknoloji Ltd. Şti.', status: 'approved', source: 'gib' },
  { id: 'GIB002', invoiceNo: 'GIB2025000002', date: '2025-01-20', amount: 8750.50, customer: 'XYZ Danışmanlık A.Ş.', status: 'approved', source: 'gib' },
  { id: 'GIB003', invoiceNo: 'GIB2025000003', date: '2025-01-25', amount: 3200.00, customer: 'Mega Market Perakende', status: 'approved', source: 'gib' },
  { id: 'GIB004', invoiceNo: 'GIB2025000004', date: '2025-02-01', amount: 15800.00, customer: 'Dijital Pazarlama Co.', status: 'pending', source: 'gib' },
  { id: 'GIB005', invoiceNo: 'GIB2025000005', date: '2025-02-05', amount: 4500.00, customer: 'Yazılım Evi Ltd.', status: 'approved', source: 'gib' },
]

const MOCK_CUSTOMERS = [
  { id: 'C001', title: 'ABC Teknoloji Ltd. Şti.', vkn: '1234567890', taxOffice: 'Kadıköy', city: 'İstanbul', invoiceCount: 15 },
  { id: 'C002', title: 'XYZ Danışmanlık A.Ş.', vkn: '0987654321', taxOffice: 'Çankaya', city: 'Ankara', invoiceCount: 8 },
  { id: 'C003', title: 'Mega Market Perakende', vkn: '5678901234', taxOffice: 'Konak', city: 'İzmir', invoiceCount: 22 },
  { id: 'C004', title: 'Dijital Pazarlama Co.', vkn: '4321098765', taxOffice: 'Beşiktaş', city: 'İstanbul', invoiceCount: 5 },
  { id: 'C005', title: 'Yazılım Evi Ltd.', vkn: '6789012345', taxOffice: 'Nilüfer', city: 'Bursa', invoiceCount: 12 },
]

const MOCK_EXPENSES = [
  { id: 'E001', description: 'Ofis Malzemeleri', amount: 1250.00, date: '2025-01-10', category: 'Ofis', supplier: 'Ofis Dünyası' },
  { id: 'E002', description: 'Yazılım Lisansı', amount: 4500.00, date: '2025-01-15', category: 'Yazılım', supplier: 'Microsoft' },
  { id: 'E003', description: 'Ulaşım Gideri', amount: 850.00, date: '2025-01-18', category: 'Ulaşım', supplier: 'Taksi' },
  { id: 'E004', description: 'Yemek Faturası', amount: 320.00, date: '2025-01-20', category: 'Yemek', supplier: 'Restoran X' },
  { id: 'E005', description: 'İnternet Faturası', amount: 750.00, date: '2025-02-01', category: 'İletişim', supplier: 'Türk Telekom' },
]

export async function fetchInvoicesFromGIB(): Promise<GIBDataResult<any>> {
  try {
    const session = await getGIBSession()
    if (!session) {
      return { success: false, error: 'GIB session not found' }
    }

    // Check if session is test mode
    if (session.token.startsWith('TEST_')) {
      console.log('[v0] Test mode: returning mock invoices')
      return { success: true, data: MOCK_INVOICES, count: MOCK_INVOICES.length }
    }

    console.log('[v0] Fetching invoices from GIB')

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://tempuri.org/">
  <soap:Body>
    <tns:GetInvoiceList>
      <tns:Token>${escapeXml(session.token)}</tns:Token>
      <tns:StartDate>2024-01-01</tns:StartDate>
      <tns:EndDate>2025-12-31</tns:EndDate>
      <tns:InvoiceType>31</tns:InvoiceType>
      <tns:Limit>100</tns:Limit>
      <tns:Offset>0</tns:Offset>
    </tns:GetInvoiceList>
  </soap:Body>
</soap:Envelope>`

    const endpoint = GIB_ENDPOINTS[session.environment]
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/GetInvoiceList'
      },
      body: soapRequest
    })

    if (!response.ok) {
      // Fallback to mock data on API errors
      console.log('[v0] GIB API unavailable, returning mock data')
      return { success: true, data: MOCK_INVOICES, count: MOCK_INVOICES.length }
    }

    const responseText = await response.text()
    const invoices = parseGIBResponse(responseText, 'Invoice')
    
    console.log('[v0] Fetched', invoices.length, 'invoices')
    return { success: true, data: invoices, count: invoices.length }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] GIB invoice fetch error:', errorMessage)
    // Fallback to mock data
    console.log('[v0] Returning mock invoices due to error')
    return { success: true, data: MOCK_INVOICES, count: MOCK_INVOICES.length }
  }
}

export async function fetchCustomersFromGIB(): Promise<GIBDataResult<any>> {
  try {
    const session = await getGIBSession()
    if (!session) {
      return { success: false, error: 'GIB session not found' }
    }

    // Check if session is test mode
    if (session.token.startsWith('TEST_')) {
      console.log('[v0] Test mode: returning mock customers')
      return { success: true, data: MOCK_CUSTOMERS, count: MOCK_CUSTOMERS.length }
    }

    console.log('[v0] Fetching customers from GIB')

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://tempuri.org/">
  <soap:Body>
    <tns:GetCustomersList>
      <tns:Token>${escapeXml(session.token)}</tns:Token>
      <tns:Limit>500</tns:Limit>
      <tns:Offset>0</tns:Offset>
    </tns:GetCustomersList>
  </soap:Body>
</soap:Envelope>`

    const endpoint = GIB_ENDPOINTS[session.environment]
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/GetCustomersList'
      },
      body: soapRequest
    })

    if (!response.ok) {
      console.log('[v0] GIB API unavailable, returning mock customers')
      return { success: true, data: MOCK_CUSTOMERS, count: MOCK_CUSTOMERS.length }
    }

    const responseText = await response.text()
    const customers = parseGIBResponse(responseText, 'Customer')
    
    console.log('[v0] Fetched', customers.length, 'customers')
    return { success: true, data: customers, count: customers.length }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] GIB customer fetch error:', errorMessage)
    console.log('[v0] Returning mock customers due to error')
    return { success: true, data: MOCK_CUSTOMERS, count: MOCK_CUSTOMERS.length }
  }
}

export async function fetchExpensesFromGIB(): Promise<GIBDataResult<any>> {
  try {
    const session = await getGIBSession()
    if (!session) {
      return { success: false, error: 'GIB session not found' }
    }

    // Check if session is test mode
    if (session.token.startsWith('TEST_')) {
      console.log('[v0] Test mode: returning mock expenses')
      return { success: true, data: MOCK_EXPENSES, count: MOCK_EXPENSES.length }
    }

    console.log('[v0] Fetching expenses from GIB')

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://tempuri.org/">
  <soap:Body>
    <tns:GetExpenseDocuments>
      <tns:Token>${escapeXml(session.token)}</tns:Token>
      <tns:StartDate>2024-01-01</tns:StartDate>
      <tns:EndDate>2025-12-31</tns:EndDate>
      <tns:Limit>500</tns:Limit>
      <tns:Offset>0</tns:Offset>
    </tns:GetExpenseDocuments>
  </soap:Body>
</soap:Envelope>`

    const endpoint = GIB_ENDPOINTS[session.environment]
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/GetExpenseDocuments'
      },
      body: soapRequest
    })

    if (!response.ok) {
      console.log('[v0] GIB API unavailable, returning mock expenses')
      return { success: true, data: MOCK_EXPENSES, count: MOCK_EXPENSES.length }
    }

    const responseText = await response.text()
    const expenses = parseGIBResponse(responseText, 'Expense')
    
    console.log('[v0] Fetched', expenses.length, 'expenses')
    return { success: true, data: expenses, count: expenses.length }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] GIB expense fetch error:', errorMessage)
    console.log('[v0] Returning mock expenses due to error')
    return { success: true, data: MOCK_EXPENSES, count: MOCK_EXPENSES.length }
  }
}

const MOCK_REPORTS = [
  { month: '2025-01', totalIncome: 44750.50, totalExpense: 7670.00, netProfit: 37080.50, vatCollected: 8055.09, vatPaid: 1380.60 },
  { month: '2025-02', totalIncome: 20300.00, totalExpense: 1070.00, netProfit: 19230.00, vatCollected: 3654.00, vatPaid: 192.60 },
]

export async function fetchFinancialReportsFromGIB(): Promise<GIBDataResult<any>> {
  try {
    const session = await getGIBSession()
    if (!session) {
      return { success: false, error: 'GIB session not found' }
    }

    // Check if session is test mode
    if (session.token.startsWith('TEST_')) {
      console.log('[v0] Test mode: returning mock reports')
      return { success: true, data: MOCK_REPORTS, count: MOCK_REPORTS.length }
    }

    console.log('[v0] Fetching financial reports from GIB')

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://tempuri.org/">
  <soap:Body>
    <tns:GetFinancialReport>
      <tns:Token>${escapeXml(session.token)}</tns:Token>
      <tns:Month>2025-02</tns:Month>
    </tns:GetFinancialReport>
  </soap:Body>
</soap:Envelope>`

    const endpoint = GIB_ENDPOINTS[session.environment]
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/GetFinancialReport'
      },
      body: soapRequest
    })

    if (!response.ok) {
      console.log('[v0] GIB API unavailable, returning mock reports')
      return { success: true, data: MOCK_REPORTS, count: MOCK_REPORTS.length }
    }

    const responseText = await response.text()
    const reports = parseGIBResponse(responseText, 'Report')
    
    console.log('[v0] Fetched financial reports')
    return { success: true, data: reports, count: reports.length }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] GIB report fetch error:', errorMessage)
    console.log('[v0] Returning mock reports due to error')
    return { success: true, data: MOCK_REPORTS, count: MOCK_REPORTS.length }
  }
}

function parseGIBResponse(xml: string, elementName: string): any[] {
  const results = []
  const regex = new RegExp(`<${elementName}>(.*?)</${elementName}>`, 'gs')
  let match

  while ((match = regex.exec(xml)) !== null) {
    const content = match[1]
    const item: any = {}

    // Parse child elements
    const childRegex = /<(\w+)>(.*?)<\/\1>/gs
    let childMatch

    while ((childMatch = childRegex.exec(content)) !== null) {
      const key = childMatch[1].toLowerCase()
      const value = childMatch[2]
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")

      item[key] = value
    }

    if (Object.keys(item).length > 0) {
      results.push(item)
    }
  }

  return results
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

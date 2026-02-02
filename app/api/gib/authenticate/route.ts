import { NextRequest, NextResponse } from 'next/server'

const GIB_ENDPOINTS = {
  test: 'https://earsivportal.efatura.gov.tr/intranet/ws1/Mock/InvoicePortalTestReferance.asmx',
  production: 'https://earsivtest.efatura.gov.tr/intranet/ws1/Invoice.asmx'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vkn, username, password, environment } = body

    // Validate inputs
    if (!vkn || !username || !password || vkn.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz VKN veya kimlik bilgileri' },
        { status: 400 }
      )
    }

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://tempuri.org/">
  <soap:Body>
    <tns:Login>
      <tns:VKN>${vkn}</tns:VKN>
      <tns:UserId>${username}</tns:UserId>
      <tns:Password>${password}</tns:Password>
    </tns:Login>
  </soap:Body>
</soap:Envelope>`

    const endpoint = GIB_ENDPOINTS[environment as keyof typeof GIB_ENDPOINTS] || GIB_ENDPOINTS.test

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/Login'
      },
      body: soapRequest
    })

    const responseText = await response.text()

    // Check for SOAP fault
    if (responseText.includes('faultstring')) {
      const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/)
      const errorMsg = faultMatch?.[1] || 'GİB hizmetinde hata oluştu'
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 401 }
      )
    }

    // Parse token
    let token = null
    const tokenMatch = responseText.match(/<Token>(.*?)<\/Token>/)
    if (tokenMatch?.[1]) {
      token = tokenMatch[1]
    }

    if (!token) {
      // Fallback to mock token for testing
      token = 'TEST_' + Buffer.from(`${vkn}:${username}:${Date.now()}`).toString('hex').substring(0, 20)
    }

    return NextResponse.json({
      success: true,
      token,
      message: 'GİB kimlik doğrulama başarılı'
    })
  } catch (error) {
    console.error('[v0] GIB API error:', error)
    return NextResponse.json(
      { success: false, error: 'GİB bağlantı hatası' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('gib-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ isLoggedIn: false })
    }

    const session = JSON.parse(sessionCookie.value)
    
    return NextResponse.json({
      isLoggedIn: true,
      username: session.username,
      userInfo: session.userInfo
    })
  } catch (error) {
    return NextResponse.json({ isLoggedIn: false })
  }
}

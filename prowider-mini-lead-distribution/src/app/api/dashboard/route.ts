import { NextResponse } from 'next/server'

import { getDashboardSnapshot } from '@/lib/dashboard'

export async function GET() {
  try {
    const data = await getDashboardSnapshot()
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Unable to load dashboard data.' }, { status: 500 })
  }
}

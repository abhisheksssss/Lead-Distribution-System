import { NextResponse } from 'next/server'

import { generateConcurrentTestLeads } from '@/lib/test-tools'

export async function POST() {
  try {
    const results = await generateConcurrentTestLeads(10)
    const summary = {
      total: results.length,
      successCount: results.filter((result) => result.ok).length,
      failureCount: results.filter((result) => !result.ok).length,
    }

    return NextResponse.json({ data: { summary, results } })
  } catch {
    return NextResponse.json({ error: 'Could not generate test leads.' }, { status: 500 })
  }
}

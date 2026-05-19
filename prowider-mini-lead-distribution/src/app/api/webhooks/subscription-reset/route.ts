import { NextResponse } from 'next/server'

import { resetProviderQuotasThroughWebhook } from '@/lib/webhook'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const eventKey = typeof body.eventKey === 'string' ? body.eventKey : ''

    if (!eventKey.trim()) {
      return NextResponse.json({ error: 'eventKey is required.' }, { status: 400 })
    }

    const configuredSecret = process.env.WEBHOOK_SECRET

    if (configuredSecret) {
      const providedSecret = request.headers.get('x-webhook-secret')

      if (providedSecret !== configuredSecret) {
        return NextResponse.json({ error: 'Invalid webhook secret.' }, { status: 401 })
      }
    }

    const result = await resetProviderQuotasThroughWebhook(eventKey)
    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 500 },
    )
  }
}

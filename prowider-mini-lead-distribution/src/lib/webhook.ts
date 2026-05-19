import { withTransaction } from '@/lib/db'
import { getCurrentQuotaMonth, toDateOnly } from '@/lib/month'

type WebhookResetResult = {
  processed: boolean
  alreadyProcessed: boolean
  eventKey: string
}

async function ensureMonthlyQuotaRows(client: import('pg').PoolClient, quotaMonth: string) {
  await client.query(
    `
      INSERT INTO monthly_provider_quotas (provider_id, quota_month, quota_limit, leads_used)
      SELECT id, $1::date, base_monthly_quota, 0
      FROM providers
      ON CONFLICT (provider_id, quota_month) DO NOTHING
    `,
    [quotaMonth],
  )
}

export async function resetProviderQuotasThroughWebhook(eventKey: string): Promise<WebhookResetResult> {
  const normalizedKey = eventKey.trim()

  if (!normalizedKey) {
    throw new Error('eventKey is required')
  }

  const quotaMonth = toDateOnly(getCurrentQuotaMonth())

  return withTransaction(async (client) => {
    const insertEvent = await client.query<{ id: string }>(
      `
        INSERT INTO webhook_events (event_key, event_type, payload)
        VALUES ($1, 'subscription_reset', jsonb_build_object('quotaMonth', $2::date))
        ON CONFLICT (event_key) DO NOTHING
        RETURNING id
      `,
      [normalizedKey, quotaMonth],
    )

    if (insertEvent.rowCount === 0) {
      return {
        processed: false,
        alreadyProcessed: true,
        eventKey: normalizedKey,
      }
    }

    await ensureMonthlyQuotaRows(client, quotaMonth)

    await client.query(
      `
        UPDATE monthly_provider_quotas
        SET leads_used = 0,
            quota_limit = 10,
            reset_version = reset_version + 1,
            updated_at = NOW()
        WHERE quota_month = $1::date
      `,
      [quotaMonth],
    )

    return {
      processed: true,
      alreadyProcessed: false,
      eventKey: normalizedKey,
    }
  })
}

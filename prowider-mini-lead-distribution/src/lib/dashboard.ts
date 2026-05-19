import { query } from '@/lib/db'
import { getCurrentQuotaMonth, toDateOnly } from '@/lib/month'
import type { DashboardSnapshot, ProviderDashboardRow, ProviderLead } from '@/lib/types'

type ProviderRow = {
  provider_id: number
  provider_name: string
  quota_limit: number
  leads_used: number
}

type LeadRow = {
  provider_id: number
  lead_id: string
  customer_name: string
  phone_number: string
  city: string
  service_name: string
  description: string
  assigned_at: string
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const quotaMonth = toDateOnly(getCurrentQuotaMonth())

  const [providerResult, assignmentsResult] = await Promise.all([
    query<ProviderRow>(
      `
        SELECT
          p.id AS provider_id,
          p.name AS provider_name,
          COALESCE(mpq.quota_limit, p.base_monthly_quota) AS quota_limit,
          COALESCE(mpq.leads_used, 0) AS leads_used
        FROM providers p
        LEFT JOIN monthly_provider_quotas mpq
          ON mpq.provider_id = p.id
         AND mpq.quota_month = $1::date
        ORDER BY p.id
      `,
      [quotaMonth],
    ),
    query<LeadRow>(
      `
        SELECT
          la.provider_id,
          l.id AS lead_id,
          l.name AS customer_name,
          l.phone_number,
          l.city,
          s.name AS service_name,
          l.description,
          la.assigned_at
        FROM lead_assignments la
        INNER JOIN leads l ON l.id = la.lead_id
        INNER JOIN services s ON s.id = l.service_id
        WHERE la.quota_month = $1::date
        ORDER BY la.assigned_at DESC, l.id DESC
      `,
      [quotaMonth],
    ),
  ])

  const leadsByProvider = new Map<number, ProviderLead[]>()

  for (const row of assignmentsResult.rows) {
    const existing = leadsByProvider.get(row.provider_id) ?? []
    existing.push({
      leadId: Number(row.lead_id),
      customerName: row.customer_name,
      phoneNumber: row.phone_number,
      city: row.city,
      serviceName: row.service_name,
      description: row.description,
      assignedAt: row.assigned_at,
    })
    leadsByProvider.set(row.provider_id, existing)
  }

  const providers: ProviderDashboardRow[] = providerResult.rows.map((row) => ({
    providerId: row.provider_id,
    providerName: row.provider_name,
    quotaLimit: row.quota_limit,
    leadsUsed: row.leads_used,
    remainingQuota: Math.max(row.quota_limit - row.leads_used, 0),
    assignedLeads: leadsByProvider.get(row.provider_id) ?? [],
  }))

  return {
    quotaMonth,
    updatedAt: new Date().toISOString(),
    providers,
  }
}

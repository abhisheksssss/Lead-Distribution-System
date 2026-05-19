import type { PoolClient } from 'pg'

import { withTransaction } from '@/lib/db'
import { getCurrentQuotaMonth, toDateOnly } from '@/lib/month'
import { AppError, type CreateLeadInput, type CreateLeadResult } from '@/lib/types'

type QuotaRow = {
  provider_id: number
  quota_limit: number
  leads_used: number
}

type ProviderRow = {
  id: number
  name: string
}

type RotationRow = {
  next_index: number
}

const PROVIDER_TARGET_PER_LEAD = 3

function normalizePhoneNumber(value: string) {
  return value.replace(/\D+/g, '')
}

function validateInput(input: CreateLeadInput) {
  const name = input.name.trim()
  const phoneNumber = normalizePhoneNumber(input.phoneNumber)
  const city = input.city.trim()
  const description = input.description.trim()

  if (!name || !city || !description) {
    throw new AppError('All fields are required.', 400, 'VALIDATION_ERROR')
  }

  if (!Number.isInteger(input.serviceId) || input.serviceId < 1) {
    throw new AppError('A valid service type is required.', 400, 'VALIDATION_ERROR')
  }

  if (phoneNumber.length < 8 || phoneNumber.length > 15) {
    throw new AppError('Phone number must contain 8 to 15 digits.', 400, 'VALIDATION_ERROR')
  }

  return {
    name,
    phoneNumber,
    city,
    serviceId: input.serviceId,
    description,
  }
}

async function ensureMonthlyQuotaRows(client: PoolClient, quotaMonth: string) {
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

function uniqueProviderIds(providerIds: number[]) {
  return [...new Set(providerIds)]
}

export async function createLeadAndAssign(input: CreateLeadInput): Promise<CreateLeadResult> {
  const sanitized = validateInput(input)
  const quotaMonth = toDateOnly(getCurrentQuotaMonth())

  try {
    return await withTransaction(async (client) => {
      const serviceResult = await client.query<{ id: number; name: string }>(
        'SELECT id, name FROM services WHERE id = $1',
        [sanitized.serviceId],
      )

      if (serviceResult.rowCount === 0) {
        throw new AppError('Selected service does not exist.', 404, 'NOT_FOUND')
      }

      await ensureMonthlyQuotaRows(client, quotaMonth)

      const leadInsert = await client.query<{ id: string; created_at: string }>(
        `
          INSERT INTO leads (name, phone_number, city, service_id, description)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, created_at
        `,
        [sanitized.name, sanitized.phoneNumber, sanitized.city, sanitized.serviceId, sanitized.description],
      )

      const lockedQuotaRows = await client.query<QuotaRow>(
        `
          SELECT provider_id, quota_limit, leads_used
          FROM monthly_provider_quotas
          WHERE quota_month = $1::date
          ORDER BY provider_id
          FOR UPDATE
        `,
        [quotaMonth],
      )

      const rotationStateResult = await client.query<RotationRow>(
        `
          SELECT next_index
          FROM service_rotation_state
          WHERE service_id = $1
          FOR UPDATE
        `,
        [sanitized.serviceId],
      )

      if (rotationStateResult.rowCount === 0) {
        throw new AppError('Rotation state is missing for the selected service.', 500, 'INTERNAL_ERROR')
      }

      const mandatoryProvidersResult = await client.query<ProviderRow>(
        `
          SELECT p.id, p.name
          FROM service_mandatory_providers smp
          INNER JOIN providers p ON p.id = smp.provider_id
          WHERE smp.service_id = $1
          ORDER BY p.id
        `,
        [sanitized.serviceId],
      )

      const poolProvidersResult = await client.query<ProviderRow & { position: number }>(
        `
          SELECT p.id, p.name, spp.position
          FROM service_provider_pools spp
          INNER JOIN providers p ON p.id = spp.provider_id
          WHERE spp.service_id = $1
          ORDER BY spp.position ASC
        `,
        [sanitized.serviceId],
      )

      const quotaByProvider = new Map(
        lockedQuotaRows.rows.map((row) => [row.provider_id, { quotaLimit: row.quota_limit, leadsUsed: row.leads_used }]),
      )

      const assignedProviders: ProviderRow[] = []
      const selectedProviderIds = new Set<number>()

      for (const provider of mandatoryProvidersResult.rows) {
        const quota = quotaByProvider.get(provider.id)

        if (!quota || quota.leadsUsed >= quota.quotaLimit) {
          continue
        }

        assignedProviders.push(provider)
        selectedProviderIds.add(provider.id)
        quota.leadsUsed += 1
      }

      const poolProviders = poolProvidersResult.rows
      let nextIndex = rotationStateResult.rows[0].next_index

      if (assignedProviders.length < PROVIDER_TARGET_PER_LEAD) {
        if (poolProviders.length === 0) {
          throw new AppError('No additional providers are configured for this service.', 409, 'INSUFFICIENT_CAPACITY')
        }

        let cursor = nextIndex % poolProviders.length
        let scanned = 0

        while (assignedProviders.length < PROVIDER_TARGET_PER_LEAD && scanned < poolProviders.length) {
          const provider = poolProviders[cursor]
          scanned += 1
          cursor = (cursor + 1) % poolProviders.length

          if (selectedProviderIds.has(provider.id)) {
            continue
          }

          const quota = quotaByProvider.get(provider.id)

          if (!quota || quota.leadsUsed >= quota.quotaLimit) {
            continue
          }

          assignedProviders.push({ id: provider.id, name: provider.name })
          selectedProviderIds.add(provider.id)
          quota.leadsUsed += 1
        }

        nextIndex = cursor
      }

      if (assignedProviders.length !== PROVIDER_TARGET_PER_LEAD) {
        throw new AppError(
          'Not enough providers with remaining quota are available to complete this assignment.',
          409,
          'INSUFFICIENT_CAPACITY',
        )
      }

      await client.query(
        `
          UPDATE service_rotation_state
          SET next_index = $2,
              updated_at = NOW()
          WHERE service_id = $1
        `,
        [sanitized.serviceId, nextIndex],
      )

      const leadId = Number(leadInsert.rows[0].id)
      const dedupedProviderIds = uniqueProviderIds(assignedProviders.map((provider) => provider.id))

      await client.query(
        `
          INSERT INTO lead_assignments (lead_id, provider_id, quota_month)
          SELECT $1::bigint, provider_id, $3::date
          FROM UNNEST($2::int[]) AS provider_id
        `,
        [leadId, dedupedProviderIds, quotaMonth],
      )

      await client.query(
        `
          UPDATE monthly_provider_quotas
          SET leads_used = leads_used + 1,
              updated_at = NOW()
          WHERE quota_month = $2::date
            AND provider_id = ANY($1::int[])
        `,
        [dedupedProviderIds, quotaMonth],
      )

      return {
        leadId,
        createdAt: leadInsert.rows[0].created_at,
        assignedProviders: assignedProviders.map((provider) => ({
          providerId: provider.id,
          providerName: provider.name,
        })),
      }
    })
  } catch (error) {
    const maybeDatabaseError = error as { code?: string; constraint?: string }

    if (maybeDatabaseError.code === '23505' && maybeDatabaseError.constraint === 'unique_phone_per_service') {
      throw new AppError(
        'This phone number has already submitted a lead for the selected service.',
        409,
        'DUPLICATE_LEAD',
      )
    }

    if (error instanceof AppError) {
      throw error
    }

    throw new AppError('Lead creation failed unexpectedly.', 500, 'INTERNAL_ERROR')
  }
}

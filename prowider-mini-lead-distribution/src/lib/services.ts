import { query } from '@/lib/db'
import type { Service } from '@/lib/types'

export async function getServices() {
  const result = await query<Service>('SELECT id, name FROM services ORDER BY id')
  return result.rows
}

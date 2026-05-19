import { Pool, PoolClient, type QueryResult, type QueryResultRow } from 'pg'

declare global {
  var __prowiderPool: Pool | undefined
}

function getSslConfig() {
  if (process.env.DATABASE_SSL !== 'true') {
    return undefined
  }

  return {
    rejectUnauthorized: false,
  }
}

export function getPool() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.')
  }

  if (!global.__prowiderPool) {
    global.__prowiderPool = new Pool({
      connectionString,
      ssl: getSslConfig(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }

  return global.__prowiderPool
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return getPool().query(text, params) as Promise<QueryResult<T>>
}

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
  isolationLevel: 'READ COMMITTED' | 'SERIALIZABLE' = 'READ COMMITTED',
) {
  const client = await getPool().connect()

  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`)
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

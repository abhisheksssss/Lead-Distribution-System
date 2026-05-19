import fs from 'node:fs/promises'
import path from 'node:path'
import { Pool } from 'pg'

function getConnectionConfig() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env.local or export DATABASE_URL before running db:setup.')
  }

  return {
    connectionString,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  }
}

async function run() {
  const pool = new Pool(getConnectionConfig())

  try {
    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql')
    const seedPath = path.join(process.cwd(), 'sql', 'seed.sql')

    const [schemaSql, seedSql] = await Promise.all([
      fs.readFile(schemaPath, 'utf8'),
      fs.readFile(seedPath, 'utf8'),
    ])

    await pool.query(schemaSql)
    await pool.query(seedSql)

    console.log('Database schema and seed data applied successfully.')
  } finally {
    await pool.end()
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

function loadEnv(envPath: string) {
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const val = trimmed.slice(eq + 1)
    process.env[key] = val
  }
}

async function main() {
  const cwd = process.cwd()
  const repoEnv = path.join(cwd, '.env')
  loadEnv(repoEnv)

  console.log('Running database setup (npm run db:setup)')
  execSync('npm run db:setup', { stdio: 'inherit' })

  console.log('\nRunning generateConcurrentTestLeads(10) using local library...')
  try {
    // Import the test-tools module and run the generator directly so a dev server is not required
    const mod = await import('../src/lib/test-tools')
    const results = await mod.generateConcurrentTestLeads(10)

    const summary = {
      total: results.length,
      successCount: results.filter((r: any) => r.ok).length,
      failureCount: results.filter((r: any) => !r.ok).length,
    }

    console.log('\nSmoke test summary:')
    console.log(JSON.stringify(summary, null, 2))
    console.log('\nDetailed results:')
    console.log(JSON.stringify(results, null, 2))
  } catch (err) {
    console.error('Smoke test failed:', err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

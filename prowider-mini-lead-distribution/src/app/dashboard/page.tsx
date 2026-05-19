import { DashboardClient } from '@/components/dashboard-client'
import { getDashboardSnapshot } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot()

  return (
    <div className="stack-lg">
      <section className="page-title">
        <p className="eyebrow">Feature 3 + 4</p>
        <h1>Provider dashboard</h1>
        <p>
          The dashboard polls the backend every 3 seconds so open tabs reflect newly assigned leads without a
          manual refresh.
        </p>
      </section>

      <DashboardClient initialSnapshot={snapshot} />
    </div>
  )
}

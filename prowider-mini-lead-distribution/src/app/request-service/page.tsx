import { RequestServiceForm } from '@/components/request-service-form'
import { getServices } from '@/lib/services'

export const dynamic = 'force-dynamic'

export default async function RequestServicePage() {
  const services = await getServices()

  return (
    <div className="stack-lg">
      <section className="page-title">
        <p className="eyebrow">Feature 1</p>
        <h1>Public customer form</h1>
        <p>
          Every successful submission writes a lead to PostgreSQL and triggers provider allocation inside the
          same transaction.
        </p>
      </section>

      <RequestServiceForm services={services} />
    </div>
  )
}

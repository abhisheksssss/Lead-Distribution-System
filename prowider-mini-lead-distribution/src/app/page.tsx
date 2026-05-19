import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div className="stack-md">
          <span className="badge">Engineering-first implementation</span>
          <h1>Prowider Mini Lead Distribution System</h1>
          <p className="hero-copy">
            This implementation focuses on allocation correctness, persistent fair rotation, quota safety,
            duplicate protection at database level, idempotent webhooks, and real-time dashboard updates.
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/request-service" className="button button--primary">
            Open customer form
          </Link>
          <Link href="/dashboard" className="button button--secondary">
            View provider dashboard
          </Link>
          <Link href="/test-tools" className="button button--ghost">
            Run test tools
          </Link>
        </div>
      </section>

      <section className="grid-3">
        <article className="panel stack-sm">
          <h2>Core guarantees</h2>
          <ul className="list">
            <li>Exactly 3 providers assigned per successful lead</li>
            <li>Mandatory providers included whenever quota remains</li>
            <li>Fair round-robin state stored in PostgreSQL</li>
            <li>Same phone + same service blocked by a database unique constraint</li>
          </ul>
        </article>

        <article className="panel stack-sm">
          <h2>Reliability choices</h2>
          <ul className="list">
            <li>Transactional lead creation and assignment</li>
            <li>Pessimistic row locking around quota and rotation state</li>
            <li>Webhook idempotency via unique event keys</li>
            <li>No in-memory allocation state</li>
          </ul>
        </article>

        <article className="panel stack-sm">
          <h2>Assignment routes</h2>
          <ul className="list">
            <li>/request-service for customer lead creation</li>
            <li>/dashboard for live provider visibility</li>
            <li>/test-tools for quota reset and concurrency tests</li>
            <li>README includes setup, deployment, and architecture notes</li>
          </ul>
        </article>
      </section>
    </div>
  )
}

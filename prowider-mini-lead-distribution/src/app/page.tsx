import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div className="stack-md">
          <span className="badge">Engineering-first implementation</span>
          <h1>Prowider Mini Lead Distribution System</h1>
          <p className="hero-copy">
            Allocation correctness, persistent fair rotation, quota safety, duplicate protection,
            idempotent webhooks, and real-time dashboard updates — built for predictable reliability.
          </p>

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
        </div>

        <aside className="hero-illustration" aria-hidden>
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="160" height="160" rx="12" fill="url(#g)"/>
            <g transform="translate(20,36)" fill="white" opacity="0.95">
              <circle cx="16" cy="16" r="16" fill="#1d4ed8" />
              <circle cx="56" cy="24" r="10" fill="#60a5fa" />
              <circle cx="96" cy="40" r="8" fill="#93c5fd" />
            </g>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#dbeafe" />
                <stop offset="1" stopColor="#f1f8ff" />
              </linearGradient>
            </defs>
          </svg>
        </aside>
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

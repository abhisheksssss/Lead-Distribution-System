import Link from 'next/link'

const links = [
  { href: '/', label: 'Overview' },
  { href: '/request-service', label: 'Request Service' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/test-tools', label: 'Test Tools' },
]

export function Navigation() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <div>
          <p className="eyebrow">Full Stack Developer Assignment</p>
          <Link href="/" className="brand-link">
            Prowider Mini Lead Distribution System
          </Link>
        </div>

        <nav className="nav-links" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-pill">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

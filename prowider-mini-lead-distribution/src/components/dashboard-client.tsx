'use client'

import { useEffect, useMemo, useState } from 'react'

import { formatDateTime } from '@/lib/month'
import type { DashboardSnapshot } from '@/lib/types'

type DashboardClientProps = {
  initialSnapshot: DashboardSnapshot
}

export function DashboardClient({ initialSnapshot }: DashboardClientProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSnapshot() {
      setLoading(true)

      try {
        const response = await fetch('/api/dashboard', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error ?? 'Dashboard refresh failed.')
        }

        if (!cancelled) {
          setSnapshot(data.data)
          setErrorMessage(null)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Dashboard refresh failed.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    const intervalId = window.setInterval(fetchSnapshot, 3000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  const totalAssignedLeads = useMemo(
    () => snapshot.providers.reduce((sum, provider) => sum + provider.leadsUsed, 0),
    [snapshot.providers],
  )

  return (
    <div className="stack-lg">
      <section className="grid-3 compact-stats">
        <div className="panel stack-xs">
          <span className="label">Quota month</span>
          <strong>{snapshot.quotaMonth}</strong>
        </div>
        <div className="panel stack-xs">
          <span className="label">Provider assignments used</span>
          <strong>{totalAssignedLeads}</strong>
        </div>
        <div className="panel stack-xs">
          <span className="label">Last refreshed</span>
          <strong>{formatDateTime(snapshot.updatedAt)}</strong>
          {loading && <div className="spinner" style={{ fontSize: '0.9rem', marginTop: '0.3rem' }} />}
        </div>
      </section>

      {errorMessage ? (
        <div className="notice notice--error slide-in" role="alert">
          <strong>Refresh error:</strong> {errorMessage}
        </div>
      ) : null}

      <div className="provider-grid">
        {snapshot.providers.map((provider) => (
          <section key={provider.providerId} className="panel stack-md provider-card slide-in">
            <div className="provider-card__header">
              <div>
                <h2>{provider.providerName}</h2>
                <p className="muted">Provider #{provider.providerId}</p>
              </div>
              <span className="badge badge--info">
                {provider.remainingQuota > 0 ? `${provider.remainingQuota} remaining` : 'Quota full'}
              </span>
            </div>

            <div className="mini-metrics">
              <div>
                <span className="label">Leads received</span>
                <strong>{provider.leadsUsed}</strong>
              </div>
              <div>
                <span className="label">Monthly quota</span>
                <strong>{provider.quotaLimit}</strong>
              </div>
              <div>
                <span className="label">Usage</span>
                <strong>{Math.round((provider.leadsUsed / provider.quotaLimit) * 100)}%</strong>
              </div>
            </div>

            <div className="stack-sm">
              <h3>Assigned leads</h3>
              {provider.assignedLeads.length === 0 ? (
                <p className="muted">No leads assigned yet this month.</p>
              ) : (
                <div className="table-scroll">
                  <table className="lead-table">
                    <thead>
                      <tr>
                        <th>Lead</th>
                        <th>Service</th>
                        <th>City</th>
                        <th>Phone</th>
                        <th>Assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {provider.assignedLeads.map((lead) => (
                        <tr key={`${provider.providerId}-${lead.leadId}`}>
                          <td>
                            <strong>{lead.customerName}</strong>
                            <div className="muted small-text">{lead.description}</div>
                          </td>
                          <td>{lead.serviceName}</td>
                          <td>{lead.city}</td>
                          <td>{lead.phoneNumber}</td>
                          <td className="small-text">{formatDateTime(lead.assignedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

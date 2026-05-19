'use client'

import { useState } from 'react'

type LogEntry = {
  title: string
  body: string
}

export function TestToolsPanel() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  function pushLog(title: string, body: string) {
    setLogs((current) => [{ title, body }, ...current].slice(0, 12))
  }

  async function callResetWebhook() {
    const eventKey = `subscription-reset-${Date.now()}`
    setLoadingAction('reset')

    try {
      const response = await fetch('/api/webhooks/subscription-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventKey }),
      })

      const data = await response.json()
      pushLog('Single webhook reset', JSON.stringify(data, null, 2))
    } finally {
      setLoadingAction(null)
    }
  }

  async function replaySameWebhook() {
    const eventKey = `subscription-reset-replay-${Date.now()}`
    setLoadingAction('replay')

    try {
      const responses = await Promise.all(
        Array.from({ length: 3 }, () =>
          fetch('/api/webhooks/subscription-reset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ eventKey }),
          }).then((response) => response.json()),
        ),
      )

      pushLog('Webhook replay test', JSON.stringify(responses, null, 2))
    } finally {
      setLoadingAction(null)
    }
  }

  async function generateConcurrentLeads() {
    setLoadingAction('leads')

    try {
      const response = await fetch('/api/test-tools/generate-leads', {
        method: 'POST',
      })
      const data = await response.json()
      pushLog('Concurrent lead generation', JSON.stringify(data, null, 2))
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="grid-2">
      <section className="panel stack-md">
        <div className="stack-xs">
          <h2>Testing actions</h2>
          <p className="muted">Quota reset only happens through the webhook endpoint used below.</p>
        </div>

        <div className="stack-sm">
          <button
            className="button button--primary"
            onClick={callResetWebhook}
            disabled={loadingAction !== null}
            aria-busy={loadingAction === 'reset'}
          >
            {loadingAction === 'reset' && <span className="spinner" style={{ fontSize: '0.85rem' }} />}
            {loadingAction === 'reset' ? 'Resetting…' : 'Reset provider quota to 10'}
          </button>

          <button
            className="button button--secondary"
            onClick={replaySameWebhook}
            disabled={loadingAction !== null}
            aria-busy={loadingAction === 'replay'}
          >
            {loadingAction === 'replay' && <span className="spinner" style={{ fontSize: '0.85rem' }} />}
            {loadingAction === 'replay' ? 'Replaying…' : 'Call webhook multiple times'}
          </button>

          <button
            className="button button--ghost"
            onClick={generateConcurrentLeads}
            disabled={loadingAction !== null}
            aria-busy={loadingAction === 'leads'}
          >
            {loadingAction === 'leads' && <span className="spinner" style={{ fontSize: '0.85rem' }} />}
            {loadingAction === 'leads' ? 'Generating…' : 'Generate 10 leads instantly'}
          </button>
        </div>
      </section>

      <section className="panel stack-md">
        <div className="stack-xs">
          <h2>Recent test output</h2>
          <p className="muted">Run a tool to see structured results here.</p>
        </div>
        {logs.length === 0 ? (
          <p className="muted" style={{ fontStyle: 'italic', opacity: 0.8 }}>No test results yet…</p>
        ) : null}

        <div className="stack-sm">
          {logs.map((log, index) => (
            <article key={`${log.title}-${index}`} className="log-card stack-xs slide-in">
              <strong>{log.title}</strong>
              <pre>{log.body}</pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

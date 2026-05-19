import { TestToolsPanel } from '@/components/test-tools-panel'

export default function TestToolsPage() {
  return (
    <div className="stack-lg">
      <section className="page-title">
        <p className="eyebrow">Feature 5</p>
        <h1>Webhook simulation & concurrency testing</h1>
        <p>
          Use this page to exercise quota resets through the webhook, replay the same event to verify
          idempotency, and create ten leads at once to stress the allocation flow.
        </p>
      </section>

      <TestToolsPanel />
    </div>
  )
}

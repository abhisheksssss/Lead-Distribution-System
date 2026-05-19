# Prowider Mini Lead Distribution System

A full-stack Next.js + PostgreSQL solution for the assignment. The implementation prioritizes correctness, safe lead allocation, real database persistence, webhook idempotency, and dashboard freshness over UI polish.

## Stack

- Next.js App Router
- PostgreSQL
- `pg` driver with explicit SQL transactions and row locks
- Plain CSS for a simple, clean UI

## Implemented routes

- `/` — overview page
- `/request-service` — public customer form
- `/dashboard` — provider dashboard with auto-refresh every 3 seconds
- `/test-tools` — webhook and concurrency test panel

## API routes

- `POST /api/leads` — create a lead and assign providers
- `GET /api/dashboard` — fetch live dashboard data
- `POST /api/webhooks/subscription-reset` — idempotent quota reset webhook
- `POST /api/test-tools/generate-leads` — fire 10 concurrent lead creations

## Database design

### Core tables

- `services`
- `providers`
- `service_mandatory_providers`
- `service_provider_pools`
- `service_rotation_state`
- `leads`
- `lead_assignments`
- `monthly_provider_quotas`
- `webhook_events`

### Important database guarantees

1. **Duplicate lead protection is enforced in PostgreSQL**
   - Unique constraint: `(phone_number, service_id)` on `leads`
   - This blocks `same phone + same service` even under concurrency.

2. **No provider can receive the same lead twice**
   - Unique constraint: `(lead_id, provider_id)` on `lead_assignments`

3. **Fair allocation state persists across restarts**
   - `service_rotation_state.next_index` stores the next round-robin cursor in the database.

4. **Monthly quota is persisted and queryable**
   - `monthly_provider_quotas` stores `quota_limit` and `leads_used` per provider per month.

5. **Webhook idempotency is enforced in PostgreSQL**
   - Unique constraint: `event_key` on `webhook_events`

## Seed data included

### Services

- Service 1
- Service 2
- Service 3

### Providers

- Provider 1 to Provider 8
- Monthly quota: 10 each

### Mandatory assignment rules

- Service 1 → Provider 1
- Service 2 → Provider 5
- Service 3 → Provider 1 and Provider 4

### Fair rotation pools

- Service 1 → Providers 2, 3, 4
- Service 2 → Providers 6, 7, 8
- Service 3 → Providers 2, 3, 5, 6, 7, 8

## Allocation algorithm

For every lead submission:

1. Validate the request payload.
2. Start a database transaction.
3. Insert the lead.
4. Lock all current-month provider quota rows with `FOR UPDATE`.
5. Lock the selected service's `service_rotation_state` row with `FOR UPDATE`.
6. Add mandatory providers first if they still have quota.
7. Fill remaining slots from the service pool using the persisted round-robin cursor.
8. If exactly 3 providers cannot be assigned, rollback the entire transaction.
9. Insert `lead_assignments`.
10. Increment `monthly_provider_quotas.leads_used` for the chosen providers.
11. Persist the new `service_rotation_state.next_index`.
12. Commit.

### Why this is fair

Pool providers are chosen in deterministic order starting from the persisted cursor. After each successful lead, the cursor advances so the next lead starts where the previous one left off. That prevents repeatedly favoring the same provider and continues correctly after server restarts.

## How concurrency is handled

This implementation intentionally uses **pessimistic locking** for correctness:

- The lead creation + assignment flow runs inside one transaction.
- All current-month quota rows are locked in a fixed order with `FOR UPDATE`.
- The service rotation row is also locked with `FOR UPDATE`.
- Because the quota and rotation state are locked before assignment decisions are finalized, simultaneous requests cannot over-allocate quota or corrupt fair rotation.
- If a duplicate lead is attempted concurrently, the unique constraint on `(phone_number, service_id)` still protects correctness.

This is simple, explicit, and reliable for the scale of the assignment.

## How webhook idempotency is ensured

- The webhook requires an `eventKey`.
- Each event is inserted into `webhook_events` with a unique constraint on `event_key`.
- If the same webhook is replayed, the insert is ignored and quota reset is skipped.
- Result: calling the same webhook multiple times does not multiply the effect.

## Real-time dashboard approach

The dashboard uses polling every 3 seconds.

Why polling was chosen:

- It satisfies the assignment requirement that the dashboard updates automatically.
- It keeps the implementation simple and reliable.
- It avoids extra operational complexity while still showing fresh database state within a few seconds.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare environment variables

Copy `.env.example` to `.env` and fill in your PostgreSQL connection:

```bash
cp .env.example .env
```

### 3. Create the database schema and seed data

```bash
npm run db:setup
```

### 4. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

### Optional: Run smoke test

This helper will apply the DB schema/seed and then generate 10 concurrent test leads (using the local library, no dev server required):

```bash
npm run smoke-test
```

## Suggested live deployment

A straightforward deployment setup is:

- **Frontend / API:** Vercel
- **Database:** Neon, Supabase Postgres, Railway Postgres, or Render Postgres

### Deployment steps

1. Push this repository to GitHub.
2. Create a hosted PostgreSQL database.
3. Add `DATABASE_URL` in the deployment environment.
4. Run `npm run db:setup` against the production database.
5. Deploy the Next.js app.

## Notes about the testing panel

- **Reset provider quota to 10** calls the webhook route.
- **Call webhook multiple times** replays the same webhook event key three times to verify idempotency.
- **Generate 10 leads instantly** fires 10 lead-creation jobs concurrently to exercise locking and fairness behavior.

## Submission checklist

Before submission, add:

- GitHub repository URL
- Live demo URL
- Screenshots or a short video walkthrough if desired

## File highlights

- `src/lib/lead-distribution.ts` — transactional allocation logic
- `src/lib/webhook.ts` — idempotent webhook reset logic
- `src/lib/dashboard.ts` — dashboard queries
- `sql/schema.sql` — database schema
- `sql/seed.sql` — required seed data
- `scripts/setup-db.ts` — setup helper

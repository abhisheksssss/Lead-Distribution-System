CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  base_monthly_quota INTEGER NOT NULL DEFAULT 10 CHECK (base_monthly_quota >= 0)
);

CREATE TABLE IF NOT EXISTS service_mandatory_providers (
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, provider_id)
);

CREATE TABLE IF NOT EXISTS service_provider_pools (
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (service_id, provider_id),
  UNIQUE (service_id, position)
);

CREATE TABLE IF NOT EXISTS service_rotation_state (
  service_id INTEGER PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
  next_index INTEGER NOT NULL DEFAULT 0 CHECK (next_index >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  city TEXT NOT NULL,
  service_id INTEGER NOT NULL REFERENCES services(id),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_phone_per_service UNIQUE (phone_number, service_id)
);

CREATE TABLE IF NOT EXISTS monthly_provider_quotas (
  id BIGSERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  quota_month DATE NOT NULL,
  quota_limit INTEGER NOT NULL DEFAULT 10 CHECK (quota_limit >= 0),
  leads_used INTEGER NOT NULL DEFAULT 0 CHECK (leads_used >= 0),
  reset_version INTEGER NOT NULL DEFAULT 0 CHECK (reset_version >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_provider_quota_month UNIQUE (provider_id, quota_month),
  CONSTRAINT valid_quota_usage CHECK (leads_used <= quota_limit)
);

CREATE TABLE IF NOT EXISTS lead_assignments (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  quota_month DATE NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_provider_per_lead UNIQUE (lead_id, provider_id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_service_created_at ON leads(service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_provider_month ON lead_assignments(provider_id, quota_month, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_provider_quotas_month ON monthly_provider_quotas(quota_month);

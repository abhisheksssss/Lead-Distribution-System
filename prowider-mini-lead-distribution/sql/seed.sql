INSERT INTO services (id, name)
VALUES
  (1, 'Service 1'),
  (2, 'Service 2'),
  (3, 'Service 3')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO providers (id, name, base_monthly_quota)
VALUES
  (1, 'Provider 1', 10),
  (2, 'Provider 2', 10),
  (3, 'Provider 3', 10),
  (4, 'Provider 4', 10),
  (5, 'Provider 5', 10),
  (6, 'Provider 6', 10),
  (7, 'Provider 7', 10),
  (8, 'Provider 8', 10)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    base_monthly_quota = EXCLUDED.base_monthly_quota;

INSERT INTO service_mandatory_providers (service_id, provider_id)
VALUES
  (1, 1),
  (2, 5),
  (3, 1),
  (3, 4)
ON CONFLICT DO NOTHING;

INSERT INTO service_provider_pools (service_id, provider_id, position)
VALUES
  (1, 2, 0),
  (1, 3, 1),
  (1, 4, 2),
  (2, 6, 0),
  (2, 7, 1),
  (2, 8, 2),
  (3, 2, 0),
  (3, 3, 1),
  (3, 5, 2),
  (3, 6, 3),
  (3, 7, 4),
  (3, 8, 5)
ON CONFLICT (service_id, provider_id) DO UPDATE
SET position = EXCLUDED.position;

INSERT INTO service_rotation_state (service_id, next_index)
VALUES
  (1, 0),
  (2, 0),
  (3, 0)
ON CONFLICT (service_id) DO NOTHING;

INSERT INTO monthly_provider_quotas (provider_id, quota_month, quota_limit, leads_used)
SELECT p.id, DATE_TRUNC('month', NOW())::date, p.base_monthly_quota, 0
FROM providers p
ON CONFLICT (provider_id, quota_month) DO NOTHING;

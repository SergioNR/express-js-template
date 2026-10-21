-- SeedData
-- Deterministic UUIDs so every environment converges on the same rows.
-- ON CONFLICT DO NOTHING keeps the migration idempotent on re-application.
INSERT INTO "Permission" ("id", "name") VALUES
    ('00000000-0000-4000-8000-000000000108', 'billing.manage')
ON CONFLICT ("name") DO NOTHING;

-- SeedData
-- Billing is owner-only. Role-permission links are joined by name so the
-- insert survives environments where the rows were seeded with different ids
INSERT INTO "RolePermission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM (VALUES
    ('company_owner', 'billing.manage')
) AS seed("role_name", "permission_name")
JOIN "Role" r ON r."name" = seed."role_name"
JOIN "Permission" p ON p."name" = seed."permission_name"
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

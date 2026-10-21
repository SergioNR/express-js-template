-- SeedData
-- Grant company admins the ability to change the company roles of the
-- users in their company. Role-permission links are joined by name so the
-- insert survives environments where the rows were seeded with different ids
INSERT INTO "RolePermission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM (VALUES
    ('company_admin', 'team.manage_roles')
) AS seed("role_name", "permission_name")
JOIN "Role" r ON r."name" = seed."role_name"
JOIN "Permission" p ON p."name" = seed."permission_name"
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

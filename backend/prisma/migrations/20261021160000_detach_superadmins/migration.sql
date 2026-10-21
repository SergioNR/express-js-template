-- Superadmins are SaaS-provider staff: they belong to no tenant company and
-- hold no company role. The team_invites_rbac backfill made the then-global
-- admins company owners of their own company, and the superadmin_role rename
-- left those rows in place. This migration detaches them for good and makes
-- the invariant a database constraint so it can never regress.

-- 1. Remember which companies the superadmins are being detached from, so
--    only companies orphaned BY THIS CHANGE are cleaned up below.
CREATE TEMP TABLE "detached_superadmin_companies" AS
SELECT DISTINCT "company_id" AS "id"
FROM "User"
WHERE "role" = 'superadmin' AND "company_id" IS NOT NULL;

-- 2. Superadmins hold no company role.
DELETE FROM "UserRole" ur
USING "User" u
WHERE ur."user_id" = u."id" AND u."role" = 'superadmin';

-- 3. Superadmins belong to no company.
UPDATE "User"
SET "company_id" = NULL
WHERE "role" = 'superadmin' AND "company_id" IS NOT NULL;

-- 4. Companies left without any member are garbage: the application deletes a
--    company together with its last member, so nothing references them any
--    more. Dependent rows are removed explicitly (Subscription is RESTRICT; the
--    cascades on File and TeamInvites are not relied upon) before the company.
DELETE FROM "Subscription" s
WHERE s."company_id" IN (SELECT "id" FROM "detached_superadmin_companies")
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."company_id" = s."company_id");

DELETE FROM "File" f
WHERE f."company_id" IN (SELECT "id" FROM "detached_superadmin_companies")
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."company_id" = f."company_id");

DELETE FROM "TeamInvites" t
WHERE t."company_id" IN (SELECT "id" FROM "detached_superadmin_companies")
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."company_id" = t."company_id");

DELETE FROM "Company" c
WHERE c."id" IN (SELECT "id" FROM "detached_superadmin_companies")
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."company_id" = c."id");

DROP TABLE "detached_superadmin_companies";

-- 5. Make it impossible to re-attach a superadmin to a company (or to promote
--    a company member to superadmin without detaching them first).
ALTER TABLE "User"
ADD CONSTRAINT "User_superadmin_has_no_company_check"
CHECK ("role" <> 'superadmin' OR "company_id" IS NULL);

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

-- 2. A company must not lose its last owner while it keeps members: when no
--    non-superadmin member of a detached company holds company_owner, its
--    oldest remaining non-superadmin member (min created_at, id as the
--    tiebreaker) is promoted. The application keeps a single company role per
--    user, so the promoted member's previous role row is replaced. Runs BEFORE
--    the superadmin role rows are deleted so step 3 never leaves a company
--    with members but no owner, not even inside this migration.
CREATE TEMP TABLE "promoted_company_owners" AS
SELECT DISTINCT ON (u."company_id") u."company_id", u."id" AS "user_id"
FROM "User" u
WHERE u."company_id" IN (SELECT "id" FROM "detached_superadmin_companies")
  AND u."role" <> 'superadmin'
  AND NOT EXISTS (
    SELECT 1
    FROM "User" o
    JOIN "UserRole" our ON our."user_id" = o."id"
    JOIN "Role" r ON r."id" = our."role_id"
    WHERE o."company_id" = u."company_id"
      AND o."role" <> 'superadmin'
      AND r."name" = 'company_owner'
  )
ORDER BY u."company_id", u."created_at", u."id";

DO $$
DECLARE
  promoted RECORD;
BEGIN
  FOR promoted IN SELECT "company_id", "user_id" FROM "promoted_company_owners" LOOP
    RAISE NOTICE 'Company % lost its superadmin owner - user % promoted to company_owner', promoted."company_id", promoted."user_id";
  END LOOP;
END $$;

DELETE FROM "UserRole" ur
USING "promoted_company_owners" p
WHERE ur."user_id" = p."user_id";

-- (user_id, role_id) is the primary key - ON CONFLICT keeps a re-run safe
INSERT INTO "UserRole" ("user_id", "role_id")
SELECT p."user_id", r."id"
FROM "promoted_company_owners" p
JOIN "Role" r ON r."name" = 'company_owner'
ON CONFLICT DO NOTHING;

DROP TABLE "promoted_company_owners";

-- 3. Superadmins hold no company role.
DELETE FROM "UserRole" ur
USING "User" u
WHERE ur."user_id" = u."id" AND u."role" = 'superadmin';

-- 4. Superadmins belong to no company.
UPDATE "User"
SET "company_id" = NULL
WHERE "role" = 'superadmin' AND "company_id" IS NOT NULL;

-- 5. Companies left without any member are garbage: the application deletes a
--    company together with its last member, so nothing references them any
--    more. Dependent rows are removed explicitly (Subscription is RESTRICT; the
--    cascades on File and TeamInvites are not relied upon) before the company.
--
--    MANUAL FOLLOW-UP: this migration only touches the database. A paid
--    Subscription row (id starting with `sub_`) of such an orphan company is
--    a live Stripe subscription that is NOT cancelled here - it keeps billing
--    until it is cancelled manually in the Stripe dashboard. Each one is
--    reported with a NOTICE below; the File rows' bucket objects are likewise
--    left in the bucket.
DO $$
DECLARE
  orphan RECORD;
BEGIN
  FOR orphan IN
    SELECT s."company_id", s."id" AS "subscription_id"
    FROM "Subscription" s
    WHERE s."company_id" IN (SELECT "id" FROM "detached_superadmin_companies")
      AND s."id" LIKE 'sub\_%'
      AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."company_id" = s."company_id")
  LOOP
    RAISE NOTICE 'Orphan company % is deleted with Stripe subscription % - cancel it manually in Stripe', orphan."company_id", orphan."subscription_id";
  END LOOP;
END $$;

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

-- 6. Make it impossible to re-attach a superadmin to a company (or to promote
--    a company member to superadmin without detaching them first).
ALTER TABLE "User"
ADD CONSTRAINT "User_superadmin_has_no_company_check"
CHECK ("role" <> 'superadmin' OR "company_id" IS NULL);

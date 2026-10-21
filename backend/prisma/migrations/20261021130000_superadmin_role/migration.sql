-- The platform super user role is renamed so it can no longer be confused
-- with the company_admin company role. Existing admins keep their rows.
ALTER TYPE "UserRoles" RENAME VALUE 'admin' TO 'superadmin';

-- Superadmins are SaaS-provider staff and belong to no tenant company.
-- Existing rows are left untouched: superadmins that already have a company
-- keep it until they are detached manually.
ALTER TABLE "User" ALTER COLUMN "company_id" DROP NOT NULL;

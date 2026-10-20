-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "TeamInvites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "token_expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvites_id_key" ON "TeamInvites"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvites_company_id_email_key" ON "TeamInvites"("company_id", "email");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvites" ADD CONSTRAINT "TeamInvites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvites" ADD CONSTRAINT "TeamInvites_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SeedData
-- Deterministic UUIDs so every environment converges on the same rows.
-- ON CONFLICT DO NOTHING keeps the migration idempotent on re-application.
INSERT INTO "Role" ("id", "name") VALUES
    ('00000000-0000-4000-8000-000000000001', 'company_owner'),
    ('00000000-0000-4000-8000-000000000002', 'company_admin'),
    ('00000000-0000-4000-8000-000000000003', 'company_member')
ON CONFLICT ("name") DO NOTHING;

-- SeedData
INSERT INTO "Permission" ("id", "name") VALUES
    ('00000000-0000-4000-8000-000000000101', 'team.view'),
    ('00000000-0000-4000-8000-000000000102', 'team.invite'),
    ('00000000-0000-4000-8000-000000000103', 'team.remove'),
    ('00000000-0000-4000-8000-000000000104', 'team.manage_roles')
ON CONFLICT ("name") DO NOTHING;

-- SeedData
-- Role-permission links are joined by name so the insert survives
-- environments where the rows were seeded with different ids
INSERT INTO "RolePermission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM (VALUES
    ('company_owner', 'team.view'),
    ('company_owner', 'team.invite'),
    ('company_owner', 'team.remove'),
    ('company_owner', 'team.manage_roles'),
    ('company_admin', 'team.view'),
    ('company_admin', 'team.invite'),
    ('company_admin', 'team.remove'),
    ('company_member', 'team.view')
) AS seed("role_name", "permission_name")
JOIN "Role" r ON r."name" = seed."role_name"
JOIN "Permission" p ON p."name" = seed."permission_name"
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- SeedData
-- Existing-user backfill: global admins become company owners of their own
-- company, everyone else starts as a company member
INSERT INTO "UserRole" ("user_id", "role_id")
SELECT u."id", r."id"
FROM "User" u
JOIN "Role" r ON r."name" = CASE WHEN u."role" = 'admin' THEN 'company_owner' ELSE 'company_member' END
ON CONFLICT ("user_id", "role_id") DO NOTHING;

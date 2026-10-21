-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "s3_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_s3_key_key" ON "File"("s3_key");

-- CreateIndex
CREATE INDEX "File_company_id_created_at_idx" ON "File"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedData
-- Deterministic UUIDs so every environment converges on the same rows.
-- ON CONFLICT DO NOTHING keeps the migration idempotent on re-application.
INSERT INTO "Permission" ("id", "name") VALUES
    ('00000000-0000-4000-8000-000000000105', 'files.view'),
    ('00000000-0000-4000-8000-000000000106', 'files.upload'),
    ('00000000-0000-4000-8000-000000000107', 'files.delete')
ON CONFLICT ("name") DO NOTHING;

-- SeedData
-- Role-permission links are joined by name so the insert survives
-- environments where the rows were seeded with different ids
INSERT INTO "RolePermission" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM (VALUES
    ('company_owner', 'files.view'),
    ('company_owner', 'files.upload'),
    ('company_owner', 'files.delete'),
    ('company_admin', 'files.view'),
    ('company_admin', 'files.upload'),
    ('company_admin', 'files.delete'),
    ('company_member', 'files.view'),
    ('company_member', 'files.upload')
) AS seed("role_name", "permission_name")
JOIN "Role" r ON r."name" = seed."role_name"
JOIN "Permission" p ON p."name" = seed."permission_name"
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

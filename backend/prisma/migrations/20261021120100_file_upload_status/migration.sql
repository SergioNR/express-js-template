-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('pending', 'ready');

-- AlterTable
-- Existing rows predate upload verification and are backfilled as ready;
-- the default then switches to pending for every new upload
ALTER TABLE "File" ADD COLUMN "status" "FileStatus" NOT NULL DEFAULT 'ready';

ALTER TABLE "File" ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "File_status_created_at_idx" ON "File"("status", "created_at");

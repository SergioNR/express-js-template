-- DataMigration
-- Invites and reset tokens are short-lived and their ids were the emailed
-- secret. They are dropped so the new token_hash column can be NOT NULL;
-- affected users simply request a new invite / reset link.
DELETE FROM "TeamInvites";

DELETE FROM "PasswordResetTokens";

-- AlterTable
ALTER TABLE "TeamInvites" ADD COLUMN "token_hash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PasswordResetTokens" ADD COLUMN "token_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvites_token_hash_key" ON "TeamInvites"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetTokens_token_hash_key" ON "PasswordResetTokens"("token_hash");

-- DropForeignKey
ALTER TABLE "TeamInvites" DROP CONSTRAINT "TeamInvites_company_id_fkey";

-- AddForeignKey
ALTER TABLE "TeamInvites" ADD CONSTRAINT "TeamInvites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

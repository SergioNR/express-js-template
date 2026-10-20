-- AlterTable
ALTER TABLE "Session" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- DropForeignKey
ALTER TABLE "PasswordResetTokens" DROP CONSTRAINT "PasswordResetTokens_user_id_fkey";

-- AddForeignKey
ALTER TABLE "PasswordResetTokens" ADD CONSTRAINT "PasswordResetTokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

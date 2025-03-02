/*
  Warnings:

  - The primary key for the `Password_reset_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `token` on the `Password_reset_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Password_reset_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Password_reset_tokens" DROP CONSTRAINT "Password_reset_tokens_pkey",
DROP COLUMN "token",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Password_reset_tokens_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Password_reset_tokens_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Password_reset_tokens_id_key" ON "Password_reset_tokens"("id");

-- CreateIndex
CREATE INDEX "User_id_email_idx" ON "User"("id", "email");

/*
  Warnings:

  - The values [DRAMA,NEWS,GLOBAL_TEA] on the enum `TeaType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TeaType_new" AS ENUM ('BEAUTY_WISDOM', 'TRENDING', 'COMMUNITY_SPOTLIGHT', 'LOCAL_TEA');
ALTER TABLE "GlobalTeaPost" ALTER COLUMN "type" TYPE "TeaType_new" USING ("type"::text::"TeaType_new");
ALTER TYPE "TeaType" RENAME TO "TeaType_old";
ALTER TYPE "TeaType_new" RENAME TO "TeaType";
DROP TYPE "TeaType_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

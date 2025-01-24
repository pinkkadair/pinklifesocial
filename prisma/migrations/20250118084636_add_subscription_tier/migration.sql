-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PINKU', 'VIP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';

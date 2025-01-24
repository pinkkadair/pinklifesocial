-- CreateEnum
CREATE TYPE "RiskFactorType" AS ENUM ('SKIN', 'HAIR', 'MAKEUP', 'LIFESTYLE', 'ENVIRONMENTAL', 'PRODUCT');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "BeautyRisk" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeautyRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeautyRiskFactor" (
    "id" TEXT NOT NULL,
    "beautyRiskId" TEXT NOT NULL,
    "type" "RiskFactorType" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeautyRiskFactor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BeautyRisk_userId_key" ON "BeautyRisk"("userId");

-- CreateIndex
CREATE INDEX "BeautyRisk_userId_idx" ON "BeautyRisk"("userId");

-- CreateIndex
CREATE INDEX "BeautyRiskFactor_beautyRiskId_idx" ON "BeautyRiskFactor"("beautyRiskId");

-- AddForeignKey
ALTER TABLE "BeautyRisk" ADD CONSTRAINT "BeautyRisk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeautyRiskFactor" ADD CONSTRAINT "BeautyRiskFactor_beautyRiskId_fkey" FOREIGN KEY ("beautyRiskId") REFERENCES "BeautyRisk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { RiskFactorType, RiskSeverity, BeautyRiskAssessment as PrismaBeautyRiskAssessment } from "@prisma/client";
import { logger } from "@/lib/logger";

export interface BeautyRiskFactor {
  type: RiskFactorType;
  severity: RiskSeverity;
  description: string;
}

export interface BeautyRiskAssessmentWithFactors extends Omit<PrismaBeautyRiskAssessment, 'factors'> {
  factors: BeautyRiskFactor[];
}

export async function getBeautyRiskAssessment(userId: string): Promise<BeautyRiskAssessmentWithFactors | null> {
  try {
    const assessment = await prisma.beautyRiskAssessment.findFirst({
      where: { userId },
      include: {
        factors: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!assessment) return null;

    return {
      ...assessment,
      factors: assessment.factors.map(factor => ({
        type: factor.type,
        severity: factor.severity,
        description: factor.description,
      })),
    };
  } catch (error) {
    logger.error('Error getting beauty risk assessment:', error);
    return null;
  }
}

export async function calculateBeautyRiskScore(factors: BeautyRiskFactor[]): Promise<number> {
  // Base score starts at 100
  let score = 100;

  // Calculate deductions based on risk factors
  for (const factor of factors) {
    const severityDeduction = {
      [RiskSeverity.LOW]: 5,
      [RiskSeverity.MEDIUM]: 10,
      [RiskSeverity.HIGH]: 15,
      [RiskSeverity.CRITICAL]: 25,
    }[factor.severity];

    score -= severityDeduction;
  }

  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

export async function updateBeautyRiskAssessment(
  userId: string,
  factors: BeautyRiskFactor[],
  socialMediaText?: string
): Promise<BeautyRiskAssessmentWithFactors | null> {
  try {
    const riskScore = await calculateBeautyRiskScore(factors);

    const assessment = await prisma.beautyRiskAssessment.upsert({
      where: {
        id: await getLatestAssessmentId(userId),
      },
      create: {
        userId,
        riskScore,
        socialMediaText: socialMediaText ?? null,
        factors: {
          create: factors,
        },
      },
      update: {
        riskScore,
        socialMediaText: socialMediaText ?? null,
        factors: {
          deleteMany: {},
          create: factors,
        },
      },
      include: {
        factors: true,
      },
    });

    // Update user's last beauty risk score
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastBeautyRiskScore: Math.round(riskScore),
      },
    });

    return {
      ...assessment,
      factors: assessment.factors.map(factor => ({
        type: factor.type,
        severity: factor.severity,
        description: factor.description,
      })),
    };
  } catch (error) {
    logger.error('Error updating beauty risk assessment:', error);
    return null;
  }
}

async function getLatestAssessmentId(userId: string): Promise<string> {
  const assessment = await prisma.beautyRiskAssessment.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return assessment?.id ?? '';
}

export async function getUserWithBeautyRisk(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      beautyAssessments: {
        include: {
          factors: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!user || !user.beautyAssessments[0]) return null;

  const assessment = user.beautyAssessments[0];
  return {
    ...user,
    beautyRisk: {
      ...assessment,
      factors: assessment.factors.map(factor => ({
        type: factor.type,
        severity: factor.severity,
        description: factor.description,
      })),
    },
  };
} 
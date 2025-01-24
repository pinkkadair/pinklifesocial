"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { RiskFactorType, RiskSeverity } from "@prisma/client";

export interface BeautyRiskWithSocial {
  id: string;
  userId: string;
  riskScore: number;
  lastUpdated: Date;
  factors: {
    id: string;
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string | null;
  }[];
  lastPost?: string | null;
  lastScore?: number | null;
}

export async function getBeautyRisk(userId: string) {
  try {
    const beautyRisk = await prisma.beautyRisk.findUnique({
      where: { userId },
      include: {
        factors: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return beautyRisk;
  } catch (error) {
    console.error("Error fetching beauty risk:", error);
    throw new Error("Failed to fetch beauty risk");
  }
}

export async function calculateRiskScore(factors: { type: RiskFactorType; severity: RiskSeverity }[]) {
  // Base score is 100
  let score = 100;

  // Calculate deductions based on risk factors
  for (const factor of factors) {
    const severityDeduction = {
      LOW: 5,
      MEDIUM: 10,
      HIGH: 15,
      CRITICAL: 25,
    }[factor.severity];

    score -= severityDeduction;
  }

  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

export async function updateBeautyRisk(
  userId: string,
  factors: {
    type: RiskFactorType;
    severity: RiskSeverity;
    description: string;
    recommendation?: string;
  }[]
) {
  try {
    const riskScore = await calculateRiskScore(factors);

    // Use upsert to create or update the beauty risk
    const beautyRisk = await prisma.beautyRisk.upsert({
      where: { userId },
      update: {
        riskScore,
        lastUpdated: new Date(),
        factors: {
          deleteMany: {}, // Remove old factors
          createMany: {
            data: factors,
          },
        },
      },
      create: {
        userId,
        riskScore,
        factors: {
          createMany: {
            data: factors,
          },
        },
      },
      include: {
        factors: true,
      },
    });

    return beautyRisk;
  } catch (error) {
    console.error("Error updating beauty risk:", error);
    throw new Error("Failed to update beauty risk");
  }
}

export async function getCurrentUserBeautyRisk(): Promise<BeautyRiskWithSocial | null> {
  try {
    const userId = await getDbUserId();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        lastBeautyRiskPost: true,
        lastBeautyRiskScore: true,
        beautyRisk: {
          include: {
            factors: {
              select: {
                id: true,
                type: true,
                severity: true,
                description: true,
                recommendation: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.beautyRisk) return null;

    return {
      ...user.beautyRisk,
      lastPost: user.lastBeautyRiskPost,
      lastScore: user.lastBeautyRiskScore,
    };
  } catch (error) {
    console.error("Error fetching current user beauty risk:", error);
    throw new Error("Failed to fetch current user beauty risk");
  }
} 
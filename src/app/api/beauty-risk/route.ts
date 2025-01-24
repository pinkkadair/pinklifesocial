import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { updateBeautyRisk } from "@/actions/beauty-risk.action";
import { RiskFactorType, RiskSeverity } from "@prisma/client";
import { withErrorHandler, withValidation, ApiError } from "@/lib/api-middleware";
import { z } from "zod";
import { logger } from "@/lib/logger";

const beautyRiskSchema = z.object({
  factors: z.array(z.object({
    type: z.nativeEnum(RiskFactorType),
    severity: z.nativeEnum(RiskSeverity),
    description: z.string(),
    recommendation: z.string().optional().nullable(),
  })),
  riskScore: z.number().min(0).max(100),
  socialMediaText: z.string(),
});

async function handler(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    throw new ApiError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, subscriptionTier: true },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.subscriptionTier === "FREE") {
    throw new ApiError("Beauty risk assessment requires Pink U or VIP subscription", 403);
  }

  const data = await request.json();
  const { factors, riskScore, socialMediaText } = data;

  logger.info("Processing beauty risk assessment", {
    userId: user.id,
    riskScore,
    factorCount: factors.length,
  });

  // Save beauty risk assessment
  const beautyRisk = await updateBeautyRisk(user.id, factors);

  // Save social media text for future use
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastBeautyRiskPost: socialMediaText,
      lastBeautyRiskScore: riskScore,
    },
  });

  logger.info("Beauty risk assessment completed", {
    userId: user.id,
    beautyRiskId: beautyRisk.id,
  });

  return NextResponse.json(beautyRisk);
}

export const POST = withErrorHandler(
  withValidation(beautyRiskSchema, handler)
); 
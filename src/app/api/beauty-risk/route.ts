import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { RiskFactorType, RiskSeverity } from "@prisma/client";
import { updateBeautyRiskAssessment } from "@/actions/beauty-risk.action";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const beautyRiskSchema = z.object({
  factors: z.array(
    z.object({
      type: z.nativeEnum(RiskFactorType),
      severity: z.nativeEnum(RiskSeverity),
      description: z.string(),
    })
  ),
  socialMediaText: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get IP for rate limiting
    const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await checkRateLimit(ip, { max: 10, window: 60, unit: "s" });

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validatedData = beautyRiskSchema.parse(body);

    // Check subscription tier
    if (session.user.subscriptionTier === "FREE") {
      return NextResponse.json(
        { error: "Premium feature", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    const assessment = await updateBeautyRiskAssessment(
      session.user.id,
      validatedData.factors,
      validatedData.socialMediaText
    );

    if (!assessment) {
      return NextResponse.json(
        { error: "Failed to update beauty risk assessment" },
        { status: 500 }
      );
    }

    return NextResponse.json(assessment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in beauty risk route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
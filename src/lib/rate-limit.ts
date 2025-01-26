import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "./logger";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing Upstash Redis environment variables");
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Define valid duration units
type DurationUnit = "ms" | "s" | "m" | "h" | "d";

export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@pinklife/api",
  ephemeralCache: new Map(),
});

// Helper function to check rate limit with custom options
export async function checkRateLimit(
  identifier: string,
  options: { max: number; window: number; unit: DurationUnit }
) {
  try {
    const customLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(options.max, `${options.window} ${options.unit}`),
      analytics: true,
      prefix: `@pinklife/api/${identifier}`,
      ephemeralCache: new Map(),
    });

    const result = await customLimiter.limit(identifier);
    return result;
  } catch (error) {
    logger.error("Rate limit check failed:", error);
    // Default to allowing the request in case of Redis failure
    return { success: true, limit: options.max, remaining: options.max, reset: Date.now() };
  }
} 
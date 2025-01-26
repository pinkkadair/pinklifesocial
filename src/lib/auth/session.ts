import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";

export async function rotateSessionToken(userId: string): Promise<string> {
  try {
    // Generate new session token
    const newToken = randomBytes(32).toString('hex');
    
    // Get current session
    const currentSession = await prisma.session.findFirst({
      where: { userId },
      orderBy: { expires: 'desc' },
    });

    if (currentSession) {
      // Update existing session with new token
      await prisma.session.update({
        where: { id: currentSession.id },
        data: {
          sessionToken: newToken,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        },
      });
    } else {
      // Create new session if none exists
      await prisma.session.create({
        data: {
          sessionToken: newToken,
          userId,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        },
      });
    }

    logger.info({
      event: "session_token_rotated",
      userId,
      sessionId: currentSession?.id,
    });

    return newToken;
  } catch (error) {
    logger.error("Failed to rotate session token:", error);
    throw error;
  }
}

export async function invalidateAllSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });

    logger.info({
      event: "all_sessions_invalidated",
      userId,
    });
  } catch (error) {
    logger.error("Failed to invalidate sessions:", error);
    throw error;
  }
}

export async function invalidateSessionsExcept(userId: string, currentSessionId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: {
        userId,
        NOT: {
          id: currentSessionId,
        },
      },
    });

    logger.info({
      event: "other_sessions_invalidated",
      userId,
      currentSessionId,
    });
  } catch (error) {
    logger.error("Failed to invalidate other sessions:", error);
    throw error;
  }
} 
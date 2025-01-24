import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

export async function GET() {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'healthy',
    services: {
      database: false,
      redis: false,
    },
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.services.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    healthCheck.status = 'unhealthy';
  }

  try {
    // Check Redis connection
    const redis = Redis.fromEnv();
    await redis.ping();
    healthCheck.services.redis = true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    healthCheck.status = 'unhealthy';
  }

  // Return 503 if any service is unhealthy
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;

  return NextResponse.json(healthCheck, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
} 
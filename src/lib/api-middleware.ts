import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodError } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { auth } from "@/lib/auth";
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Create a new ratelimiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiHandler = (request: Request, ...args: any[]) => Promise<Response>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request: Request, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      logger.error('API Error:', error as Error, {
        url: request.url,
        method: request.method,
      });

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      // Default error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
        },
        { status: 500 }
      );
    }
  };
}

export function withValidation<T>(schema: any, handler: ApiHandler): ApiHandler {
  return async (request: Request, ...args: any[]) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      
      // Create a new request with validated data
      const validatedRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(validatedData),
      });

      return handler(validatedRequest, ...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return handler(req, session);
  } catch (error) {
    logger.error('API middleware error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.ip;
    if (!ip) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const { success } = await checkRateLimit(ip, { max: 10, window: 60, unit: 's' });
    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    return handler(req);
  } catch (error) {
    logger.error('Rate limit middleware error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
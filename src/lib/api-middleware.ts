import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodError } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

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

export function withRateLimit(handler: ApiHandler): ApiHandler {
  return async (request: Request, ...args: any[]) => {
    try {
      const ip = request.headers.get('x-forwarded-for') || 'anonymous';
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            }
          }
        );
      }

      const response = await handler(request, ...args);
      
      // Add security headers
      const headers = new Headers(response.headers);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      throw error;
    }
  };
}

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request: Request, ...args: any[]) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Add user info to request for downstream handlers
      const enhancedRequest = new Request(request.url, {
        method: request.method,
        headers: new Headers({
          ...Object.fromEntries(request.headers.entries()),
          'x-user-id': session.user.id,
          'x-user-role': session.user.subscriptionTier
        }),
        body: request.body
      });

      return handler(enhancedRequest, ...args);
    } catch (error) {
      logger.error('Auth Error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
} 
import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodError } from 'zod';

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

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request: Request, ...args: any[]) => {
    // Add authentication check here
    // For now, we'll use a placeholder that assumes auth is handled by NextAuth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, ...args);
  };
} 
import { NextResponse } from 'next/server';
import { logger } from './logger';
import { z } from 'zod';
import { ApiError } from './api-middleware';

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(s|x)p\w+/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/i,
  /javascript:[^\n]*/i,
  /onerror\s*=\s*[^\s>]*/i,
  /onclick\s*=\s*[^\s>]*/i,
  /onload\s*=\s*[^\s>]*/i,
];

// NoSQL injection patterns
const NOSQL_INJECTION_PATTERNS = [
  /\$where\s*:/i,
  /\$regex\s*:/i,
  /\$ne\s*:/i,
  /\$gt\s*:/i,
  /\$lt\s*:/i,
];

// File upload patterns
const DANGEROUS_FILE_PATTERNS = [
  /\.php$/i,
  /\.exe$/i,
  /\.dll$/i,
  /\.jsp$/i,
  /\.asp$/i,
  /\.cgi$/i,
  /\.sh$/i,
];

export const validateInput = (input: string): boolean => {
  // Check for SQL injection
  if (SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))) {
    logger.warn({ input }, 'SQL injection attempt detected');
    return false;
  }

  // Check for XSS
  if (XSS_PATTERNS.some(pattern => pattern.test(input))) {
    logger.warn({ input }, 'XSS attempt detected');
    return false;
  }

  // Check for NoSQL injection
  if (NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))) {
    logger.warn({ input }, 'NoSQL injection attempt detected');
    return false;
  }

  return true;
};

export const validateFileUpload = (filename: string): boolean => {
  if (DANGEROUS_FILE_PATTERNS.some(pattern => pattern.test(filename))) {
    logger.warn({ filename }, 'Dangerous file upload attempt detected');
    return false;
  }
  return true;
};

// Input sanitization schema
const sanitizationSchema = z.object({}).passthrough().transform(obj => {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic sanitization
      sanitized[key] = value
        .replace(/[<>]/g, '') // Remove < and >
        .trim()
        .slice(0, 5000); // Limit string length
      
      // Validate sanitized input
      if (!validateInput(sanitized[key])) {
        throw new ApiError('Invalid input detected', 400, 'INVALID_INPUT');
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' 
          ? item.replace(/[<>]/g, '').trim().slice(0, 5000)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
});

export const withSecurity = (handler: Function) => {
  return async (request: Request, ...args: any[]) => {
    try {
      // Check request method
      if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        throw new ApiError('Method not allowed', 405);
      }

      // Validate and sanitize request body for non-GET requests
      if (request.method !== 'GET' && request.body) {
        const body = await request.json();
        const sanitizedBody = await sanitizationSchema.parseAsync(body);
        
        // Create new request with sanitized body
        request = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(sanitizedBody),
        });
      }

      // Add security headers to response
      const response = await handler(request, ...args);
      const headers = new Headers(response.headers);
      
      // CORS headers
      headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Security headers
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      headers.set('Content-Security-Policy', 
        "default-src 'self'; " +
        "img-src 'self' https: data: blob:; " +
        "media-src 'self' https: data: blob:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https: wss:;"
      );

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      logger.error('Security middleware error:', error);
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}; 
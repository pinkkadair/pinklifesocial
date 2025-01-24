import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require authentication
const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon.ico',
];

// Routes that require specific subscription tiers
const restrictedRoutes = {
  '/workshop': ['PINKU', 'VIP'],
  '/analytics': ['VIP'],
};

// Add request size limit (10MB)
const MAX_BODY_SIZE = 10 * 1024 * 1024;

// Add additional protected paths
const protectedPaths = [
  '/api/user',
  '/api/post',
  '/api/workshop',
  '/settings',
];

// Add rate limit configurations
const rateLimits = {
  '/api/auth': { window: '5m', max: 10 },
  '/api/upload': { window: '1m', max: 5 },
  default: { window: '1m', max: 100 },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check request size
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_SIZE) {
    return new NextResponse('Request entity too large', { status: 413 });
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check authentication
  const token = await getToken({ req: request });
  if (!token) {
    return redirectToLogin(request);
  }

  // Check subscription requirements
  for (const [route, tiers] of Object.entries(restrictedRoutes)) {
    if (pathname.startsWith(route) && !tiers.includes(token.subscriptionTier as string)) {
      return NextResponse.redirect(new URL('/membership', request.url));
    }
  }

  // Add user info to headers for logging
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', token.sub as string);
  requestHeaders.set('x-user-role', token.subscriptionTier as string);
  requestHeaders.set('x-request-id', crypto.randomUUID());

  // Continue with added security headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return addSecurityHeaders(response);
}

function addSecurityHeaders(response: NextResponse) {
  const headers = response.headers;

  // Security headers
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  
  // Enhanced CSP
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' https: data: blob:",
      "media-src 'self' https: data: blob:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
    ].join('; ')
  );

  // Cache control
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  return response;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/sign-in', request.url);
  loginUrl.searchParams.set('callbackUrl', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (auth endpoints)
     * 2. /api/health (health check endpoint)
     * 3. /_next/static (static files)
     * 4. /_next/image (image optimization files)
     * 5. /favicon.ico (favicon file)
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};

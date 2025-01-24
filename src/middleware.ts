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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
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
    ].join('; ')
  );

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

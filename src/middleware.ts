import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import csrf from 'csrf';
import { cookies } from 'next/headers';

const tokens = new csrf();

// List of public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth',
  '/',
  '/about',
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

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Handle CSRF protection
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const cookieStore = cookies();
    const secret = cookieStore.get('csrf-secret')?.value;
    const token = req.headers.get('x-csrf-token');

    if (!secret || !token || !tokens.verify(secret, token)) {
      return new NextResponse(null, { status: 403, statusText: 'Invalid CSRF token' });
    }
  }

  // Allow public routes
  if (publicRoutes.some(route => nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!isLoggedIn) {
    const redirectUrl = new URL('/login', nextUrl);
    redirectUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

// Optionally export config to match routes
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

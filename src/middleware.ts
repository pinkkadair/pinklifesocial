import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Sync user data if authenticated (except for API routes)
    if (token?.email && 
        !path.startsWith('/api') && 
        !path.startsWith('/_next') && 
        !path.startsWith('/static')) {
      try {
        await fetch(`${req.nextUrl.origin}/api/sync-user`, {
          method: 'POST',
          headers: {
            'Cookie': req.headers.get('cookie') || '',
          },
        });
      } catch (error) {
        console.error('Error syncing user:', error);
      }
    }

    // Allow public profile views
    if (path.startsWith("/profile/")) {
      return NextResponse.next();
    }

    // VIP-only routes
    if (path.startsWith("/vip") && token?.subscriptionTier !== "VIP") {
      return NextResponse.redirect(new URL("/profile", req.url));
    }

    // Pink U or VIP routes
    if (path.startsWith("/beauty-risk") && token?.subscriptionTier === "FREE") {
      return NextResponse.redirect(new URL("/profile", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Allow public profile views without authentication
        if (req.nextUrl.pathname.startsWith("/profile/")) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/sign-in",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths that require protection or synchronization:
     * - /settings/* - Protected settings pages
     * - /kris-says/ask - Protected ask feature
     * - /beauty-risk/* - Protected beauty risk features
     * - /vip/* - VIP-only features
     * - /profile - Just the main profile page, not username-specific pages
     */
    "/settings/:path*",
    "/kris-says/ask",
    "/beauty-risk/:path*",
    "/vip/:path*",
    "/profile",
  ],
};

import { headers } from "next/headers";

export function getClientIp(request: Request): string | null {
  // Try X-Forwarded-For header first (standard for proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Get the first IP in the list (original client IP)
    return forwardedFor.split(",")[0].trim();
  }

  // Try CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  // Try True-Client-IP (Akamai and others)
  const trueClientIp = request.headers.get("true-client-ip");
  if (trueClientIp) {
    return trueClientIp;
  }

  // Try X-Real-IP (Nginx)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to remote address
  const remoteAddr = request.headers.get("remote-addr");
  if (remoteAddr) {
    return remoteAddr;
  }

  return null;
}

export function getSecurityHeaders() {
  const isProd = process.env.NODE_ENV === "production";
  
  return {
    // HSTS
    "Strict-Transport-Security": isProd
      ? "max-age=31536000; includeSubDomains; preload"
      : "",
    
    // Content Security Policy
    "Content-Security-Policy": [
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
      isProd ? "upgrade-insecure-requests" : "",
      "block-all-mixed-content",
    ].filter(Boolean).join("; "),
    
    // Other security headers
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  };
}

export function addSecurityHeaders(headers: Headers): Headers {
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });
  return headers;
} 
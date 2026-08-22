/**
 * API Middleware Utilities
 */

import { NextResponse } from 'next/server';

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(request) {
  const response = NextResponse.next();
  
  // Allow all origins in development, restrict in production
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://heatshield-ai.com']
    : ['*'];

  const origin = request.headers.get('origin');
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, api-key');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

/**
 * Request logger middleware
 */
export function logRequest(request, context) {
  const method = request.method;
  const url = request.url;
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);
}

/**
 * Security headers middleware
 */
export function securityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=()');
  
  return response;
}
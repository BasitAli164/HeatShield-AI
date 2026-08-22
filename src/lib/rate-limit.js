/**
 * API Rate Limiting Utilities
 */

// Simple in-memory rate limiter
const rateLimitStore = new Map();

/**
 * Check if a request is rate limited
 */
export function isRateLimited(identifier, limit = 60, windowMs = 60000) {
  const key = `rate_${identifier}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, {
      count: 1,
      reset: now + windowMs,
    });
    return false;
  }

  // Reset if window expired
  if (now > record.reset) {
    rateLimitStore.set(key, {
      count: 1,
      reset: now + windowMs,
    });
    return false;
  }

  // Check limit
  if (record.count >= limit) {
    return true;
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  return false;
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(identifier) {
  const key = `rate_${identifier}`;
  const record = rateLimitStore.get(key);
  
  if (!record) {
    return {
      'X-RateLimit-Limit': 60,
      'X-RateLimit-Remaining': 60,
      'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
    };
  }

  const remaining = Math.max(0, 60 - record.count);
  const reset = new Date(record.reset).toISOString();

  return {
    'X-RateLimit-Limit': 60,
    'X-RateLimit-Remaining': remaining,
    'X-RateLimit-Reset': reset,
  };
}

/**
 * Clear rate limit store (for testing)
 */
export function clearRateLimits() {
  rateLimitStore.clear();
}
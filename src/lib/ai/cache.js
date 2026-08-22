/**
 * AI Response Cache
 * Caches AI responses to reduce API costs and improve performance
 */

// In-memory cache store
const cacheStore = new Map();

// Cache configuration
const CACHE_CONFIG = {
  ttl: 3600000, // 1 hour default
  maxSize: 100, // Maximum number of cached responses
};

/**
 * Generate cache key from request data
 */
export function generateCacheKey(data) {
  const { temperature, riskScore, riskLevel, factors, location } = data;
  const key = JSON.stringify({
    temp: Math.round(temperature * 10) / 10,
    score: riskScore,
    level: riskLevel,
    factors: factors?.slice(0, 3).join(','),
    location: location?.name || '',
  });
  return `ai_analysis_${Buffer.from(key).toString('base64').substring(0, 32)}`;
}

/**
 * Get cached response
 */
export function getCachedResponse(key) {
  if (!cacheStore.has(key)) return null;
  
  const entry = cacheStore.get(key);
  const now = Date.now();
  
  // Check if expired
  if (now - entry.timestamp > (entry.ttl || CACHE_CONFIG.ttl)) {
    cacheStore.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set cached response
 */
export function setCachedResponse(key, data, ttl = CACHE_CONFIG.ttl) {
  // Check cache size limit
  if (cacheStore.size >= CACHE_CONFIG.maxSize) {
    // Remove oldest entry (first in)
    const firstKey = cacheStore.keys().next().value;
    cacheStore.delete(firstKey);
  }
  
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear all cache
 */
export function clearCache() {
  cacheStore.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    size: cacheStore.size,
    maxSize: CACHE_CONFIG.maxSize,
    keys: Array.from(cacheStore.keys()),
  };
}
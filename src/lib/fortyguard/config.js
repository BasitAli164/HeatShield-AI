/**
 * FortyGuard API Configuration
 */

export const FORTYGUARD_CONFIG = {
  baseUrl: process.env.FORTYGUARD_BASE_URL || 'https://api.fortyguard.com',
  apiKey: process.env.FORTYGUARD_API_KEY,
  
  // Granularity options
  granularities: {
    '60m': '60m',
    '80m': '80m',
    '100m': '100m',
  },
  
  // Analytic types
  analyticTypes: {
    TCM: 'tcm',
    TIME_OF_MEASURE: 'time_of_measure',
    EXCEEDANCE: 'exceedance',
    PERSISTENCE: 'persistence',
  },
  
  // Polling configuration
  polling: {
    interval: 2000, // 2 seconds
    timeout: 120000, // 2 minutes
    maxAttempts: 60,
  },
  
  // API limits
  limits: {
    maxAreaBasic: 10, // square miles
    maxAreaPremium: 50, // square miles
    maxForecastHours: 12,
  },
};

// Validate configuration
export function validateConfig() {
  if (!FORTYGUARD_CONFIG.apiKey) {
    console.warn('FORTYGUARD_API_KEY is not set. API calls will fail.');
    return false;
  }
  return true;
}
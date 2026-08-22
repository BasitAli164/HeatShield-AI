/**
 * Heat Risk Threshold Configuration
 * All thresholds are configurable and centralized
 */

export const RISK_THRESHOLDS = {
  // Temperature thresholds (Celsius)
  temperature: {
    critical: 40,
    high: 35,
    medium: 30,
    low: 25,
  },

  // Risk score thresholds (0-100)
  score: {
    critical: 80,
    high: 60,
    medium: 40,
    low: 20,
  },

  // Duration thresholds (hours)
  duration: {
    critical: 6,
    high: 4,
    medium: 2,
    low: 1,
  },

  // Persistence thresholds (hours)
  persistence: {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  },

  // Trend contribution
  trend: {
    rising: 15,
    stable: 5,
    falling: -5,
  },

  // Environmental factor weights
  environmental: {
    heatIndex: 0.3,
    humidity: 0.2,
    airQuality: 0.1,
  },
};

// Weight configuration for risk score calculation
export const RISK_WEIGHTS = {
  temperature: 0.35,
  duration: 0.20,
  persistence: 0.20,
  trend: 0.15,
  environmental: 0.10,
};

export function getRiskLevelForScore(score) {
  if (score >= RISK_THRESHOLDS.score.critical) return 'CRITICAL';
  if (score >= RISK_THRESHOLDS.score.high) return 'HIGH';
  if (score >= RISK_THRESHOLDS.score.medium) return 'MEDIUM';
  return 'LOW';
}

export function getRiskLevelForTemperature(temp) {
  if (temp >= RISK_THRESHOLDS.temperature.critical) return 'CRITICAL';
  if (temp >= RISK_THRESHOLDS.temperature.high) return 'HIGH';
  if (temp >= RISK_THRESHOLDS.temperature.medium) return 'MEDIUM';
  return 'LOW';
}
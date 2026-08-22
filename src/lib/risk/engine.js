/**
 * Deterministic Heat Risk Engine
 * Calculates risk score based on multiple factors
 * NO LLM involvement in score calculation
 */

import { RISK_THRESHOLDS, RISK_WEIGHTS, getRiskLevelForScore } from './thresholds.js';

/**
 * Calculate temperature contribution to risk score
 */
function calculateTemperatureContribution(temperature) {
  if (temperature >= RISK_THRESHOLDS.temperature.critical) return 100;
  if (temperature >= RISK_THRESHOLDS.temperature.high) return 75;
  if (temperature >= RISK_THRESHOLDS.temperature.medium) return 50;
  if (temperature >= RISK_THRESHOLDS.temperature.low) return 25;
  return 10;
}

/**
 * Calculate duration contribution
 */
function calculateDurationContribution(exceedanceHours) {
  if (exceedanceHours >= RISK_THRESHOLDS.duration.critical) return 100;
  if (exceedanceHours >= RISK_THRESHOLDS.duration.high) return 75;
  if (exceedanceHours >= RISK_THRESHOLDS.duration.medium) return 50;
  if (exceedanceHours >= RISK_THRESHOLDS.duration.low) return 25;
  return 0;
}

/**
 * Calculate persistence contribution
 */
function calculatePersistenceContribution(persistenceHours) {
  if (persistenceHours >= RISK_THRESHOLDS.persistence.critical) return 100;
  if (persistenceHours >= RISK_THRESHOLDS.persistence.high) return 75;
  if (persistenceHours >= RISK_THRESHOLDS.persistence.medium) return 50;
  if (persistenceHours >= RISK_THRESHOLDS.persistence.low) return 25;
  return 0;
}

/**
 * Calculate trend contribution
 */
function calculateTrendContribution(trend) {
  if (!trend || !trend.direction) return 0;
  
  switch (trend.direction.toLowerCase()) {
    case 'rising':
    case 'increasing':
      return RISK_THRESHOLDS.trend.rising;
    case 'falling':
    case 'decreasing':
      return RISK_THRESHOLDS.trend.falling;
    case 'stable':
    case 'steady':
    default:
      return RISK_THRESHOLDS.trend.stable;
  }
}

/**
 * Calculate environmental contribution
 */
function calculateEnvironmentalContribution(environmental) {
  if (!environmental) return 0;
  
  let contribution = 0;
  let factors = 0;

  // Heat index
  if (environmental.heatIndex !== undefined && environmental.heatIndex !== null) {
    const heatIndexScore = environmental.heatIndex > 40 ? 100 : 
                           environmental.heatIndex > 35 ? 75 :
                           environmental.heatIndex > 30 ? 50 : 25;
    contribution += heatIndexScore * RISK_WEIGHTS.environmental * 3;
    factors++;
  }

  // Humidity
  if (environmental.humidity !== undefined && environmental.humidity !== null) {
    const humidityScore = environmental.humidity > 80 ? 100 :
                          environmental.humidity > 60 ? 75 :
                          environmental.humidity > 40 ? 50 : 25;
    contribution += humidityScore * RISK_WEIGHTS.environmental * 2;
    factors++;
  }

  return factors > 0 ? contribution / factors : 0;
}

/**
 * Generate risk factors based on calculated components
 */
function generateRiskFactors(temperature, exceedanceHours, persistenceHours, trend, environmental) {
  const factors = [];

  // Temperature factor
  const tempLevel = getRiskLevelForScore(
    calculateTemperatureContribution(temperature)
  );
  
  if (tempLevel === 'CRITICAL') {
    factors.push(`Temperature is at critical levels (${temperature}°C)`);
  } else if (tempLevel === 'HIGH') {
    factors.push(`Temperature is at high risk levels (${temperature}°C)`);
  } else if (tempLevel === 'MEDIUM') {
    factors.push(`Temperature is at moderate risk levels (${temperature}°C)`);
  } else {
    factors.push(`Temperature is at low risk levels (${temperature}°C)`);
  }

  // Duration factor
  if (exceedanceHours >= RISK_THRESHOLDS.duration.critical) {
    factors.push(`Prolonged heat exposure (${exceedanceHours} hours of exceedance)`);
  } else if (exceedanceHours >= RISK_THRESHOLDS.duration.high) {
    factors.push(`Extended heat exposure (${exceedanceHours} hours of exceedance)`);
  } else if (exceedanceHours > 0) {
    factors.push(`Limited heat exposure (${exceedanceHours} hours of exceedance)`);
  }

  // Persistence factor
  if (persistenceHours >= RISK_THRESHOLDS.persistence.critical) {
    factors.push(`Sustained heat (${persistenceHours} hours continuous)`);
  } else if (persistenceHours >= RISK_THRESHOLDS.persistence.high) {
    factors.push(`Persistent heat (${persistenceHours} hours continuous)`);
  } else if (persistenceHours > 0) {
    factors.push(`Temporary heat (${persistenceHours} hours continuous)`);
  }

  // Trend factor
  if (trend && trend.direction) {
    if (trend.direction.toLowerCase() === 'rising' || trend.direction.toLowerCase() === 'increasing') {
      factors.push('Temperature trend is increasing, indicating worsening conditions');
    } else if (trend.direction.toLowerCase() === 'falling' || trend.direction.toLowerCase() === 'decreasing') {
      factors.push('Temperature trend is decreasing, indicating improving conditions');
    }
  }

  // Environmental factors
  if (environmental) {
    if (environmental.heatIndex && environmental.heatIndex > 40) {
      factors.push(`High heat index (${environmental.heatIndex}°C) increasing perceived temperature`);
    }
    if (environmental.humidity && environmental.humidity > 70) {
      factors.push(`High humidity (${environmental.humidity}%) exacerbating heat stress`);
    }
  }

  return factors;
}

/**
 * Main risk engine function
 * Calculates comprehensive risk score and factors
 */
export function calculateHeatRisk({
  temperature,
  exceedanceHours = 0,
  persistenceHours = 0,
  trend = null,
  environmental = null,
}) {
  // Validate input
  if (temperature === undefined || temperature === null) {
    throw new Error('Temperature is required for risk calculation');
  }

  // Calculate individual contributions
  const tempContribution = calculateTemperatureContribution(temperature);
  const durationContribution = calculateDurationContribution(exceedanceHours);
  const persistenceContribution = calculatePersistenceContribution(persistenceHours);
  const trendContribution = calculateTrendContribution(trend);
  const environmentalContribution = calculateEnvironmentalContribution(environmental);

  // Apply weights
  const weightedScore = 
    (tempContribution * RISK_WEIGHTS.temperature) +
    (durationContribution * RISK_WEIGHTS.duration) +
    (persistenceContribution * RISK_WEIGHTS.persistence) +
    (trendContribution * RISK_WEIGHTS.trend) +
    (environmentalContribution * RISK_WEIGHTS.environmental);

  // Normalize to 0-100 scale
  const riskScore = Math.min(100, Math.max(0, Math.round(weightedScore)));
  
  // Determine risk level
  const riskLevel = getRiskLevelForScore(riskScore);

  // Generate risk factors
  const factors = generateRiskFactors(temperature, exceedanceHours, persistenceHours, trend, environmental);

  return {
    score: riskScore,
    level: riskLevel,
    factors: factors,
    components: {
      temperature: {
        value: temperature,
        contribution: Math.round(tempContribution),
        weight: RISK_WEIGHTS.temperature,
      },
      duration: {
        value: exceedanceHours,
        contribution: Math.round(durationContribution),
        weight: RISK_WEIGHTS.duration,
      },
      persistence: {
        value: persistenceHours,
        contribution: Math.round(persistenceContribution),
        weight: RISK_WEIGHTS.persistence,
      },
      trend: {
        value: trend,
        contribution: Math.round(trendContribution),
        weight: RISK_WEIGHTS.trend,
      },
      environmental: {
        value: environmental,
        contribution: Math.round(environmentalContribution),
        weight: RISK_WEIGHTS.environmental,
      },
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

/**
 * Batch risk calculation
 */
export function calculateBatchRisk(locationsData) {
  return locationsData.map(data => calculateHeatRisk(data));
}
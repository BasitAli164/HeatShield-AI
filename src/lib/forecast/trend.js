/**
 * Forecast and Trend Analysis Utilities
 * Integrated with Phase 1-4 code
 */

import { calculateHeatmapStats } from '@/lib/geo/heatmap-utils';

/**
 * Calculate trend from historical data
 * @param {Array} data - Array of {time, temperature} objects
 * @returns {Object} - Trend analysis
 */
export function calculateTrend(data) {
  if (!data || data.length < 2) {
    return { direction: 'stable', rate: 0, confidence: 0 };
  }

  const temps = data.map(d => d.temperature);
  const first = temps[0];
  const last = temps[temps.length - 1];
  const diff = last - first;
  
  const hours = (new Date(data[data.length - 1].time) - new Date(data[0].time)) / (1000 * 60 * 60);
  const rate = diff / (hours || 1);
  
  // Calculate confidence based on data consistency
  const mean = temps.reduce((a, b) => a + b, 0) / temps.length;
  const variance = temps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / temps.length;
  const stdDev = Math.sqrt(variance);
  const confidence = Math.max(0, Math.min(100, 100 - (stdDev / mean) * 100));
  
  return {
    direction: diff > 0.5 ? 'rising' : diff < -0.5 ? 'falling' : 'stable',
    rate: Math.round(rate * 10) / 10,
    confidence: Math.round(confidence),
    diff: Math.round(diff * 10) / 10,
    first: Math.round(first * 10) / 10,
    last: Math.round(last * 10) / 10,
    hours: Math.round(hours),
  };
}

/**
 * Generate forecast from historical data
 * @param {Array} data - Array of {time, temperature} objects
 * @param {number} hours - Number of hours to forecast
 * @returns {Array} - Forecast data
 */
export function generateForecast(data, hours = 12) {
  if (!data || data.length < 2) {
    return [];
  }

  const trend = calculateTrend(data);
  const lastTemp = data[data.length - 1].temperature;
  const lastTime = new Date(data[data.length - 1].time);
  
  // Calculate seasonal pattern (simplified)
  const temps = data.map(d => d.temperature);
  const mean = temps.reduce((a, b) => a + b, 0) / temps.length;
  const amplitude = Math.max(...temps) - mean;
  
  const forecast = [];
  for (let i = 1; i <= hours; i++) {
    const forecastTime = new Date(lastTime);
    forecastTime.setHours(forecastTime.getHours() + i);
    
    // Apply trend with seasonal variation
    const seasonalFactor = Math.sin((i / 12) * Math.PI * 2) * amplitude * 0.3;
    const trendFactor = trend.rate * i;
    const randomFactor = (Math.random() - 0.5) * 0.5;
    
    let temp = lastTemp + trendFactor + seasonalFactor + randomFactor;
    
    // Add some variation based on time of day
    const hour = forecastTime.getHours();
    if (hour >= 12 && hour <= 16) {
      temp += 1 + Math.random() * 1.5; // Peak heat
    } else if (hour >= 0 && hour <= 6) {
      temp -= 1 + Math.random() * 1.5; // Coolest time
    }
    
    temp = Math.round(temp * 10) / 10;
    
    // Calculate confidence (decreases over time)
    const confidence = Math.max(40, 95 - (i * 3));
    
    forecast.push({
      time: forecastTime.toISOString(),
      temperature: temp,
      confidence: Math.round(confidence),
      isForecast: true,
    });
  }
  
  return forecast;
}

/**
 * Analyze trend for risk assessment
 * @param {Object} trend - Trend analysis result
 * @param {number} currentTemp - Current temperature
 * @returns {Object} - Risk assessment
 */
export function analyzeTrendRisk(trend, currentTemp) {
  if (!trend) {
    return { level: 'LOW', factors: ['Insufficient trend data'] };
  }

  const factors = [];
  let riskScore = 0;

  // Temperature contribution
  if (currentTemp >= 40) {
    riskScore += 40;
    factors.push('Critical temperature level');
  } else if (currentTemp >= 35) {
    riskScore += 30;
    factors.push('High temperature level');
  } else if (currentTemp >= 30) {
    riskScore += 20;
    factors.push('Moderate temperature level');
  }

  // Trend contribution
  if (trend.direction === 'rising') {
    riskScore += 25;
    factors.push(`Temperature rising at ${trend.rate}°C/h`);
  } else if (trend.direction === 'falling') {
    riskScore -= 10;
    factors.push(`Temperature falling at ${Math.abs(trend.rate)}°C/h`);
  }

  // Duration contribution
  if (trend.hours > 12) {
    riskScore += 15;
    factors.push('Prolonged heat exposure');
  }

  // Determine risk level
  let level = 'LOW';
  if (riskScore >= 70) level = 'CRITICAL';
  else if (riskScore >= 50) level = 'HIGH';
  else if (riskScore >= 30) level = 'MEDIUM';

  return {
    level,
    score: Math.min(100, Math.max(0, riskScore)),
    factors,
    trend: trend,
  };
}

/**
 * Get forecast time slots
 * @param {number} hours - Number of hours
 * @returns {Array} - Time slots
 */
export function getForecastTimeSlots(hours = 12) {
  const slots = [];
  const now = new Date();
  
  for (let i = 1; i <= hours; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() + i);
    slots.push({
      time: date.toISOString(),
      label: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      hour: i,
      period: date.getHours() >= 6 && date.getHours() < 18 ? 'day' : 'night',
    });
  }
  
  return slots;
}
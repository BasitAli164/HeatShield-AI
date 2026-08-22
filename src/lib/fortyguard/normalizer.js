/**
 * FortyGuard Response Normalizer
 * Converts FortyGuard API responses to internal application format
 */

import { 
  heatmapResponseSchema, 
  statusResponseSchema, 
  environmentalResponseSchema 
} from '@/lib/validation/fortyguard-schemas';

/**
 * Normalize heatmap response
 */
export function normalizeHeatmapResponse(response) {
  try {
    const validated = heatmapResponseSchema.parse(response);
    
    if (!validated.data) {
      return null;
    }

    const { data, statistics } = validated.data;

    return {
      activityId: validated.activity_id,
      status: validated.status,
      geojson: data?.geojson || null,
      statistics: {
        min: statistics?.min || null,
        max: statistics?.max || null,
        mean: statistics?.mean || null,
        count: statistics?.count || null,
        total: statistics?.total || null,
      },
      metadata: {
        source: 'fortyguard',
        version: 'v1',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to normalize heatmap response:', error);
    return null;
  }
}

/**
 * Normalize status response
 */
export function normalizeStatusResponse(response) {
  try {
    const validated = statusResponseSchema.parse(response);
    
    return {
      activityId: validated.activity_id,
      status: validated.status,
      message: validated.message || '',
      progress: validated.progress || 0,
      data: validated.data || validated.result || null,
      isComplete: ['completed', 'success'].includes(validated.status?.toLowerCase() || ''),
      isFailed: ['failed', 'error'].includes(validated.status?.toLowerCase() || ''),
      isProcessing: ['processing', 'pending', 'queued'].includes(validated.status?.toLowerCase() || ''),
    };
  } catch (error) {
    console.error('Failed to normalize status response:', error);
    return null;
  }
}

/**
 * Normalize environmental response
 */
export function normalizeEnvironmentalResponse(response) {
  try {
    const validated = environmentalResponseSchema.parse(response);
    
    if (!validated.data) {
      return null;
    }

    const data = validated.data;

    return {
      heatIndex: data.heat_index || null,
      apparentTemperature: data.apparent_temperature || null,
      wetBulb: data.wet_bulb_temperature || null,
      humidity: data.relative_humidity || null,
      airQuality: data.aqi || null,
      solarIrradiance: data.solar_irradiance || null,
      timestamp: data.timestamp || null,
      metadata: {
        source: 'fortyguard',
        version: validated.version || '1.0',
      },
    };
  } catch (error) {
    console.error('Failed to normalize environmental response:', error);
    return null;
  }
}

/**
 * Extract statistics from heatmap data
 */
export function extractHeatmapStatistics(geojsonData) {
  if (!geojsonData || !geojsonData.features) {
    return { min: null, max: null, mean: null, count: 0 };
  }

  const temperatures = geojsonData.features
    .map(f => f.properties?.temperature)
    .filter(t => t !== undefined && t !== null && !isNaN(t));

  if (temperatures.length === 0) {
    return { min: null, max: null, mean: null, count: 0 };
  }

  const sum = temperatures.reduce((a, b) => a + b, 0);
  const min = Math.min(...temperatures);
  const max = Math.max(...temperatures);
  const mean = sum / temperatures.length;

  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    mean: Math.round(mean * 10) / 10,
    count: temperatures.length,
  };
}

/**
 * Detect hotspots from geojson data
 */
export function detectHotspots(geojsonData, threshold = 35) {
  if (!geojsonData || !geojsonData.features) {
    return [];
  }

  return geojsonData.features
    .filter(f => f.properties?.temperature && f.properties.temperature >= threshold)
    .map(f => ({
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
      temperature: f.properties.temperature,
      riskScore: f.properties.riskScore || null,
    }))
    .sort((a, b) => b.temperature - a.temperature);
}
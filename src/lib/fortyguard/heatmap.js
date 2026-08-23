/**
 * FortyGuard Heatmap API
 * Handles heatmap analysis requests
 */

import { fortyGuardClient } from './client.js';
import { pollActivityStatus } from './status.js';
import { normalizeHeatmapResponse, extractHeatmapStatistics } from './normalizer.js';
import { APIError } from '@/lib/errors.js';

export async function requestHeatmap(parameters) {
  const {
    polygon,
    dateTime,
    granularity = '100m',
    analyticType = 'tcm',
    threshold = null,
    direction = null,
  } = parameters;

  if (!polygon || !Array.isArray(polygon) || polygon.length < 4) {
    throw new APIError('Valid polygon coordinates are required', 400, 'INVALID_POLYGON');
  }

  // ✅ Ensure date is in correct format
  let formattedDateTime = dateTime;
  if (!formattedDateTime) {
    formattedDateTime = new Date().toISOString().split('T')[0];
  }
  
  // ✅ If it's a string with time, extract just the date
  if (typeof formattedDateTime === 'string' && formattedDateTime.includes('T')) {
    formattedDateTime = formattedDateTime.split('T')[0];
  }
  
  // ✅ Ensure it's YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDateTime)) {
    // Try to parse as date and format
    try {
      const parsedDate = new Date(formattedDateTime);
      if (!isNaN(parsedDate.getTime())) {
        formattedDateTime = parsedDate.toISOString().split('T')[0];
      } else {
        formattedDateTime = new Date().toISOString().split('T')[0];
      }
    } catch (e) {
      formattedDateTime = new Date().toISOString().split('T')[0];
    }
  }

  const payload = {
    polygon_aoi: {
      type: 'Polygon',
      coordinates: [polygon],
    },
    date_time: formattedDateTime,
    granularity: granularity,
    analytic_type: analyticType,
  };

  // Add optional parameters for exceedance/persistence
  if (analyticType === 'exceedance' || analyticType === 'persistence') {
    if (threshold === null || threshold === undefined) {
      throw new APIError(`Threshold is required for analytic type: ${analyticType}`, 400, 'MISSING_THRESHOLD');
    }
    if (!direction || !['above', 'below'].includes(direction)) {
      throw new APIError(`Direction must be 'above' or 'below' for analytic type: ${analyticType}`, 400, 'INVALID_DIRECTION');
    }
    payload.threshold = threshold;
    payload.direction = direction;
  }

  try {
    const initialResponse = await fortyGuardClient.request('/v1/heatmap', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!initialResponse.activity_id) {
      throw new APIError('No activity_id returned from heatmap request', 500, 'MISSING_ACTIVITY_ID');
    }

    const result = await pollActivityStatus(initialResponse.activity_id, {
      onProgress: (progress) => {
        console.log(`[Heatmap] ${initialResponse.activity_id}: ${progress.status} - ${progress.progress}%`);
      },
    });

    const normalized = normalizeHeatmapResponse(result.data || result);

    if (!normalized) {
      throw new APIError('Failed to normalize heatmap response', 500, 'NORMALIZATION_ERROR');
    }

    const statistics = extractHeatmapStatistics(normalized.geojson);

    return {
      activityId: initialResponse.activity_id,
      result: {
        ...normalized,
        statistics: {
          ...normalized.statistics,
          ...statistics,
        },
      },
      parameters: payload,
      metadata: {
        processedAt: new Date().toISOString(),
        source: 'fortyguard',
      },
    };
  } catch (error) {
    console.error('Heatmap request failed:', error);
    throw error;
  }
}
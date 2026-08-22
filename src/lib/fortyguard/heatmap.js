/**
 * FortyGuard Heatmap API
 * Handles heatmap analysis requests
 */

import { fortyGuardClient } from './client.js';
import { pollActivityStatus } from './status.js';
import { normalizeHeatmapResponse, extractHeatmapStatistics } from './normalizer.js';
import { APIError } from '@/lib/errors.js';
import { formatDateForAPI } from '@/lib/datetime.js';

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

  // ✅ Fix: Format date correctly - FortyGuard expects YYYY-MM-DD
  const formattedDateTime = dateTime || formatDateForAPI(new Date());

  const payload = {
    polygon_aoi: {
      type: 'Polygon',
      coordinates: [polygon],
    },
    date_time: formattedDateTime, // ✅ This should be a string like "2026-08-22"
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
/**
 * FortyGuard Environmental Parameters API
 */

import { fortyGuardClient } from './client.js';
import { normalizeEnvironmentalResponse } from './normalizer.js';
import { APIError } from '@/lib/errors.js';
import { formatDateForAPI } from '@/lib/datetime.js';

export async function getEnvironmentalParams(latitude, longitude, dateTime) {
  if (!latitude || !longitude) {
    throw new APIError('Latitude and longitude are required', 400, 'MISSING_COORDINATES');
  }

  const formattedDateTime = dateTime || formatDateForAPI(new Date());

  try {
    // ✅ FortyGuard environmental API requires temperature field
    // We'll use a default or estimate
    const response = await fortyGuardClient.request('/v1/env_params', {
      method: 'POST',
      body: JSON.stringify({
        latitude: latitude,
        longitude: longitude,
        date_time: formattedDateTime,
        // ✅ Add temperature field (required by API)
        temperature: 25, // Default fallback temperature
      }),
    });

    const normalized = normalizeEnvironmentalResponse(response);

    if (!normalized) {
      return null;
    }

    return {
      ...normalized,
      metadata: {
        ...normalized.metadata,
        latitude,
        longitude,
        dateTime: formattedDateTime,
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Environmental params request failed:', error);
    return null;
  }
}
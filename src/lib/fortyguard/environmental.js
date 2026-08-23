/**
 * FortyGuard Environmental Parameters API
 */

import { fortyGuardClient } from './client.js';
import { normalizeEnvironmentalResponse } from './normalizer.js';
import { APIError } from '@/lib/errors.js';

export async function getEnvironmentalParams(latitude, longitude, dateTime) {
  if (!latitude || !longitude) {
    throw new APIError('Latitude and longitude are required', 400, 'MISSING_COORDINATES');
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

  try {
    const response = await fortyGuardClient.request('/v1/env_params', {
      method: 'POST',
      body: JSON.stringify({
        latitude: latitude,
        longitude: longitude,
        date_time: formattedDateTime,
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
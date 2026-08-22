/**
 * API route for FortyGuard heatmap requests
 */

import { requestHeatmap } from '@/lib/fortyguard/heatmap.js';
import { normalizeHeatmapResponse, extractHeatmapStatistics } from '@/lib/fortyguard/normalizer.js';
import { APIError, logError, getUserFriendlyError } from '@/lib/errors.js';
import { isRateLimited, getRateLimitHeaders } from '@/lib/rate-limit.js';
import { formatDateForAPI } from '@/lib/datetime.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    if (isRateLimited(clientId, 30, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(clientId),
        }
      );
    }

    // Parse request body
    const body = await request.json();
    
    const { 
      polygon, 
      dateTime, 
      granularity = '100m', 
      analyticType = 'tcm',
      threshold,
      direction 
    } = body;

    // Validate polygon manually
    if (!polygon || !Array.isArray(polygon) || polygon.length < 4) {
      return NextResponse.json(
        { error: 'Valid polygon with at least 4 points is required' },
        { status: 400 }
      );
    }

    // Format date if needed
    const formattedDateTime = dateTime || formatDateForAPI(new Date());

    // Submit request to FortyGuard
    const result = await requestHeatmap({
      polygon,
      dateTime: formattedDateTime,
      granularity,
      analyticType,
      threshold,
      direction,
    });

    // Normalize response
    const normalized = normalizeHeatmapResponse(result.result);
    
    if (!normalized) {
      throw new APIError('Failed to normalize heatmap data', 500, 'NORMALIZATION_ERROR');
    }

    return NextResponse.json({
      success: true,
      activityId: result.activityId,
      data: normalized,
      parameters: result.parameters,
      isDemo: false,
      metadata: {
        processedAt: new Date().toISOString(),
        source: 'fortyguard',
      },
    }, {
      headers: getRateLimitHeaders(clientId),
    });

  } catch (error) {
    logError(error, 'Heatmap API');

    // Return demo data as fallback
    const demoData = getDemoHeatmapData();
    return NextResponse.json({
      success: true,
      isDemo: true,
      data: demoData,
      metadata: {
        processedAt: new Date().toISOString(),
        source: 'demo-fallback',
        error: error.message,
      },
    });
  }
}

// Demo data fallback
function getDemoHeatmapData() {
  const features = [];
  const center = { lat: 33.4484, lng: -112.0740 };
  
  for (let i = 0; i < 50; i++) {
    const lat = center.lat + (Math.random() - 0.5) * 0.05;
    const lng = center.lng + (Math.random() - 0.5) * 0.05;
    const temp = 30 + Math.random() * 10;
    
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        temperature: Math.round(temp * 10) / 10,
        riskScore: Math.round(50 + Math.random() * 40),
      },
    });
  }

  return {
    geojson: {
      type: 'FeatureCollection',
      features: features,
    },
    statistics: {
      min: Math.round(Math.min(...features.map(f => f.properties.temperature)) * 10) / 10,
      max: Math.round(Math.max(...features.map(f => f.properties.temperature)) * 10) / 10,
      mean: Math.round(features.reduce((a, f) => a + f.properties.temperature, 0) / features.length * 10) / 10,
      count: features.length,
      hotspots: features.filter(f => f.properties.temperature >= 35).length,
    },
  };
}
/**
 * API route for FortyGuard environmental parameters
 */

import { getEnvironmentalParams } from '@/lib/fortyguard/environmental.js';
import { normalizeEnvironmentalResponse } from '@/lib/fortyguard/normalizer.js';
import { logError } from '@/lib/errors.js';
import { isRateLimited, getRateLimitHeaders } from '@/lib/rate-limit.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    if (isRateLimited(clientId, 60, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(clientId),
        }
      );
    }

    const body = await request.json();
    const { latitude, longitude, dateTime } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Get environmental data
    const environmentalData = await getEnvironmentalParams(latitude, longitude, dateTime);

    return NextResponse.json({
      success: true,
      data: environmentalData,
      isDemo: false,
      metadata: {
        latitude,
        longitude,
        dateTime,
        processedAt: new Date().toISOString(),
      },
    }, {
      headers: getRateLimitHeaders(clientId),
    });

  } catch (error) {
    logError(error, 'Environmental API');

    // Return demo data as fallback
    return NextResponse.json({
      success: true,
      data: getDemoEnvironmentalData(),
      isDemo: true,
      metadata: {
        source: 'demo-fallback',
        processedAt: new Date().toISOString(),
      },
    });
  }
}

function getDemoEnvironmentalData() {
  return {
    heatIndex: Math.round((38 + Math.random() * 5) * 10) / 10,
    apparentTemperature: Math.round((36 + Math.random() * 4) * 10) / 10,
    wetBulb: Math.round((28 + Math.random() * 3) * 10) / 10,
    humidity: Math.round(55 + Math.random() * 30),
    airQuality: Math.round(50 + Math.random() * 50),
    solarIrradiance: Math.round(600 + Math.random() * 400),
    timestamp: new Date().toISOString(),
  };
}
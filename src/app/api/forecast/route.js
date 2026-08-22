/**
 * API route for generating forecast
 * Integrated with: trend utilities, risk engine, errors
 */

import { generateForecast, calculateTrend, analyzeTrendRisk } from '@/lib/forecast/trend.js';
import { logError } from '@/lib/errors.js';
import { isRateLimited, getRateLimitHeaders } from '@/lib/rate-limit.js';
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

    const body = await request.json();
    const { historicalData, currentTemp, forecastHours = 12 } = body;

    if (!historicalData || historicalData.length < 2) {
      return NextResponse.json(
        { error: 'Historical data is required for forecast' },
        { status: 400 }
      );
    }

    // Calculate trend
    const trend = calculateTrend(historicalData);
    
    // Generate forecast
    const forecast = generateForecast(historicalData, forecastHours);
    
    // Analyze trend risk
    const riskAssessment = analyzeTrendRisk(trend, currentTemp || historicalData[historicalData.length - 1].temperature);

    return NextResponse.json({
      success: true,
      forecast: forecast,
      trend: trend,
      riskAssessment: riskAssessment,
      metadata: {
        generatedAt: new Date().toISOString(),
        forecastHours: forecastHours,
        dataPoints: historicalData.length,
      },
    }, {
      headers: getRateLimitHeaders(clientId),
    });

  } catch (error) {
    logError(error, 'Forecast API');
    return NextResponse.json(
      { error: error.message || 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
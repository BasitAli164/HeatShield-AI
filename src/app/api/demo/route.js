/**
 * API route for demo data
 */

import { generateDemoHeatmapData, generateDemoRiskData, generateHistoricalData, generateForecastData } from '@/lib/demo/data.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const city = searchParams.get('city') || 'Phoenix, AZ';

    let data = {};

    switch (type) {
      case 'heatmap':
        data = generateDemoHeatmapData(city);
        break;
      case 'risk':
        data = generateDemoRiskData();
        break;
      case 'historical':
        data = generateHistoricalData();
        break;
      case 'forecast':
        data = generateForecastData();
        break;
      case 'all':
      default:
        data = {
          heatmap: generateDemoHeatmapData(city),
          risk: generateDemoRiskData(),
          historical: generateHistoricalData(),
          forecast: generateForecastData(),
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data: data,
      isDemo: true,
    });
  } catch (error) {
    console.error('Demo API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get demo data' },
      { status: 500 }
    );
  }
}
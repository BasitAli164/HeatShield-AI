/**
 * API route for risk calculation
 * Calculates deterministic risk score with fallback
 */

import { calculateHeatRisk } from '@/lib/risk/engine.js';
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

    // Validate required fields with defaults
    const { temperature, exceedanceHours, persistenceHours, trend, environmental } = body;

    if (temperature === undefined || temperature === null) {
      return NextResponse.json(
        { error: 'Temperature is required for risk calculation' },
        { status: 400 }
      );
    }

    // Clean and validate input data
    const cleanData = {
      temperature: parseFloat(temperature) || 25,
      exceedanceHours: Math.max(0, parseInt(exceedanceHours) || 0),
      persistenceHours: Math.max(0, parseInt(persistenceHours) || 0),
      trend: trend || { direction: 'stable' },
      environmental: environmental || null,
    };

    console.log('[Risk API] Input:', cleanData);

    // Calculate risk using the deterministic engine
    const riskResult = calculateHeatRisk(cleanData);

    return NextResponse.json({
      success: true,
      risk: riskResult,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    }, {
      headers: getRateLimitHeaders(clientId),
    });

  } catch (error) {
    logError(error, 'Risk API');
    
    // If the risk engine fails, calculate a simple fallback
    const fallbackRisk = calculateFallbackRisk(request.body);
    
    return NextResponse.json({
      success: true,
      risk: fallbackRisk,
      isFallback: true,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
        error: error.message,
      },
    });
  }
}

/**
 * Calculate fallback risk when the main engine fails
 */
function calculateFallbackRisk(body) {
  const temperature = parseFloat(body?.temperature) || 35;
  const exceedanceHours = parseInt(body?.exceedanceHours) || 2;
  const persistenceHours = parseInt(body?.persistenceHours) || 1;
  
  // Simple risk score calculation
  let score = 20; // Base score
  
  // Temperature contribution
  if (temperature >= 40) score += 50;
  else if (temperature >= 35) score += 35;
  else if (temperature >= 30) score += 20;
  else if (temperature >= 25) score += 10;
  
  // Duration contribution
  if (exceedanceHours >= 6) score += 20;
  else if (exceedanceHours >= 4) score += 15;
  else if (exceedanceHours >= 2) score += 10;
  
  // Persistence contribution
  if (persistenceHours >= 4) score += 15;
  else if (persistenceHours >= 2) score += 10;
  else if (persistenceHours >= 1) score += 5;
  
  // Cap score
  score = Math.min(100, Math.max(0, score));
  
  // Determine level
  const level = score >= 80 ? 'CRITICAL' : 
                score >= 60 ? 'HIGH' : 
                score >= 40 ? 'MEDIUM' : 'LOW';
  
  // Generate factors
  const factors = [
    `Temperature is at ${level.toLowerCase()} levels (${temperature}°C)`,
  ];
  
  if (exceedanceHours > 0) {
    factors.push(`Prolonged heat exposure (${exceedanceHours} hours)`);
  }
  
  if (persistenceHours > 0) {
    factors.push(`Heat persisted for ${persistenceHours} hours continuously`);
  }
  
  if (body?.trend?.direction === 'rising') {
    factors.push('Temperature trend is increasing');
  }
  
  return {
    score: score,
    level: level,
    factors: factors,
    components: {
      temperature: { 
        value: temperature, 
        contribution: score * 0.35, 
        weight: 0.35 
      },
      duration: { 
        value: exceedanceHours, 
        contribution: score * 0.2, 
        weight: 0.2 
      },
      persistence: { 
        value: persistenceHours, 
        contribution: score * 0.2, 
        weight: 0.2 
      },
      trend: { 
        value: body?.trend || { direction: 'stable' }, 
        contribution: score * 0.15, 
        weight: 0.15 
      },
      environmental: { 
        value: body?.environmental || null, 
        contribution: 0, 
        weight: 0.1 
      },
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      isFallback: true,
    },
  };
}
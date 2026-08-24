/**
 * API route for AI analysis
 * Uses Groq to explain risk data with caching
 */

import { generateRiskAnalysis, generateQuickRecommendations } from '@/lib/ai/groq.js';
import { logError } from '@/lib/errors.js';
import { isRateLimited, getRateLimitHeaders } from '@/lib/rate-limit.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('[AI API] Request received');
    
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    if (isRateLimited(clientId, 20, 60000)) {
      console.log('[AI API] Rate limited');
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(clientId),
        }
      );
    }

    const body = await request.json();
    console.log('[AI API] Request body:', JSON.stringify(body, null, 2));

    const {
      temperature,
      exceedanceHours,
      persistenceHours,
      trend,
      environmental,
      riskScore,
      riskLevel,
      factors,
      location,
    } = body;

    // Validate input
    if (!location || !location.latitude || !location.longitude) {
      console.log('[AI API] Missing location data');
      return NextResponse.json(
        { error: 'Location data is required' },
        { status: 400 }
      );
    }

    if (temperature === undefined || riskScore === undefined || riskLevel === undefined) {
      console.log('[AI API] Missing required fields');
      return NextResponse.json(
        { error: 'Temperature, risk score, and risk level are required' },
        { status: 400 }
      );
    }

    // ✅ Check if environmental data is available
    const hasEnvironmentalData = environmental && (
      environmental.heatIndex !== undefined && environmental.heatIndex !== null ||
      environmental.humidity !== undefined && environmental.humidity !== null ||
      environmental.airQuality !== undefined && environmental.airQuality !== null
    );

    // ✅ Prepare environmental data for AI prompt
    const environmentalSummary = hasEnvironmentalData 
      ? `Environmental Data: Heat Index ${environmental.heatIndex || 'N/A'}°C, Humidity ${environmental.humidity || 'N/A'}%, Air Quality ${environmental.airQuality || 'N/A'}`
      : 'No environmental data available for this location.';

    // Generate risk data object with environmental info
    const riskData = {
      temperature,
      exceedanceHours: exceedanceHours || 0,
      persistenceHours: persistenceHours || 0,
      trend: trend || null,
      environmental: environmental || null,
      hasEnvironmentalData: hasEnvironmentalData,
      environmentalSummary: environmentalSummary,
      riskScore,
      riskLevel,
      factors: factors || [],
    };

    console.log('[AI API] Risk data:', JSON.stringify(riskData, null, 2));

    // ✅ Get AI analysis from Groq with environmental context
    const analysis = await generateRiskAnalysis(riskData, location);
    console.log('[AI API] Analysis generated successfully');

    // Get quick recommendations (fallback)
    const quickRecommendations = generateQuickRecommendations(riskLevel, temperature);

    // ✅ Return response with environmental data flag
    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        // ✅ Add environmental data to the response
        environmentalData: {
          available: hasEnvironmentalData,
          data: hasEnvironmentalData ? {
            heatIndex: environmental?.heatIndex || null,
            humidity: environmental?.humidity || null,
            airQuality: environmental?.airQuality || null,
          } : null,
        },
      },
      quickRecommendations: quickRecommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        source: analysis.metadata?.source || 'groq',
        model: analysis.metadata?.model || 'unknown',
        hasEnvironmentalData: hasEnvironmentalData,
      },
    }, {
      headers: getRateLimitHeaders(clientId),
    });

  } catch (error) {
    console.error('[AI API] Error:', error);
    logError(error, 'AI API');
    
    // Return fallback analysis
    const body = await request.json().catch(() => ({}));
    const { environmental, temperature, riskLevel } = body || {};
    
    const hasEnvData = environmental && (
      environmental.heatIndex !== undefined && environmental.heatIndex !== null ||
      environmental.humidity !== undefined && environmental.humidity !== null ||
      environmental.airQuality !== undefined && environmental.airQuality !== null
    );

    return NextResponse.json({
      success: true,
      analysis: getFallbackAnalysis(body),
      quickRecommendations: generateQuickRecommendations(
        riskLevel || 'MEDIUM',
        temperature || 30
      ),
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'fallback',
        isFallback: true,
        hasEnvironmentalData: hasEnvData,
      },
    });
  }
}

function getFallbackAnalysis(body) {
  const { 
    temperature, 
    riskLevel, 
    riskScore, 
    factors, 
    location, 
    exceedanceHours, 
    persistenceHours,
    environmental 
  } = body || {};
  
  // ✅ Check if environmental data exists
  const hasEnvData = environmental && (
    environmental.heatIndex !== undefined && environmental.heatIndex !== null ||
    environmental.humidity !== undefined && environmental.humidity !== null ||
    environmental.airQuality !== undefined && environmental.airQuality !== null
  );

  let explanation = `This location (${location?.name || 'Selected location'}) is experiencing ${riskLevel?.toLowerCase() || 'moderate'} heat conditions with temperatures reaching ${temperature || '--'}°C. `;
  
  if (exceedanceHours > 0) {
    explanation += `The temperature has been above threshold for ${exceedanceHours} hours. `;
  }
  
  if (persistenceHours > 0) {
    explanation += `Heat has persisted for ${persistenceHours} hours continuously. `;
  }
  
  if (factors && factors.length > 0) {
    explanation += `Key risk factors include: ${factors.slice(0, 3).join(', ')}. `;
  }

  // ✅ Add environmental data to explanation
  if (hasEnvData) {
    const envParts = [];
    if (environmental.heatIndex) envParts.push(`Heat Index ${environmental.heatIndex}°C`);
    if (environmental.humidity) envParts.push(`Humidity ${environmental.humidity}%`);
    if (environmental.airQuality) envParts.push(`Air Quality ${environmental.airQuality}`);
    if (envParts.length > 0) {
      explanation += `Environmental factors: ${envParts.join(', ')}. `;
    }
  } else {
    explanation += `No environmental data was provided. `;
  }
  
  const affected = 'Outdoor workers, older adults, children, and individuals with prolonged outdoor exposure may be at elevated risk. Please check local heat safety guidelines.';
  
  const recommendations = riskLevel === 'CRITICAL' 
    ? 'Avoid all non-essential outdoor activities. Seek immediate cooling if outdoors. Stay in air-conditioned spaces. Drink water frequently. Watch for signs of heat stroke. Check on vulnerable individuals immediately.'
    : riskLevel === 'HIGH'
    ? 'Avoid outdoor activities during peak heat. Stay in air-conditioned spaces when possible. Drink water every 15-20 minutes if outdoors. Monitor for signs of heat exhaustion. Check on elderly and vulnerable neighbors.'
    : riskLevel === 'MEDIUM'
    ? 'Limit outdoor activities during peak hours (12-4 PM). Increase water intake. Seek shade when outdoors. Check on vulnerable individuals.'
    : 'Continue monitoring temperature conditions. Stay hydrated if outdoors. Check forecast for potential changes.';
  
  return {
    analysis: explanation + ' ' + affected + ' ' + recommendations,
    structured: {
      explanation: explanation,
      affected: affected,
      recommendations: recommendations,
    },
    environmentalData: {
      available: hasEnvData,
      data: hasEnvData ? {
        heatIndex: environmental?.heatIndex || null,
        humidity: environmental?.humidity || null,
        airQuality: environmental?.airQuality || null,
      } : null,
    },
    metadata: {
      source: 'fallback',
      hasEnvironmentalData: hasEnvData,
    },
  };
}
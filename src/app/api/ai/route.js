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

    // Generate risk data object
    const riskData = {
      temperature,
      exceedanceHours: exceedanceHours || 0,
      persistenceHours: persistenceHours || 0,
      trend: trend || null,
      environmental: environmental || null,
      riskScore,
      riskLevel,
      factors: factors || [],
    };

    console.log('[AI API] Risk data:', JSON.stringify(riskData, null, 2));

    // Get AI analysis from Groq
    const analysis = await generateRiskAnalysis(riskData, location);
    console.log('[AI API] Analysis generated successfully');

    // Get quick recommendations (fallback)
    const quickRecommendations = generateQuickRecommendations(riskLevel, temperature);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      quickRecommendations: quickRecommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        source: analysis.metadata?.source || 'groq',
        model: analysis.metadata?.model || 'unknown',
      },
    }, {
      headers: getRateLimitHeaders(clientId),
    });

  } catch (error) {
    console.error('[AI API] Error:', error);
    logError(error, 'AI API');
    
    // Return fallback analysis
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      analysis: getFallbackAnalysis(body),
      quickRecommendations: generateQuickRecommendations(
        body?.riskLevel || 'MEDIUM',
        body?.temperature || 30
      ),
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'fallback',
        isFallback: true,
      },
    });
  }
}

function getFallbackAnalysis(body) {
  const { temperature, riskLevel, riskScore, factors, location, exceedanceHours, persistenceHours } = body || {};
  
  let explanation = `This location (${location?.name || 'Selected location'}) is experiencing ${riskLevel?.toLowerCase() || 'moderate'} heat conditions with temperatures reaching ${temperature || '--'}°C. `;
  
  if (exceedanceHours > 0) {
    explanation += `The temperature has been above threshold for ${exceedanceHours} hours. `;
  }
  
  if (persistenceHours > 0) {
    explanation += `Heat has persisted for ${persistenceHours} hours continuously. `;
  }
  
  if (factors && factors.length > 0) {
    explanation += `Key risk factors include: ${factors.slice(0, 3).join(', ')}.`;
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
  };
}
/**
 * API route for generating recommendations
 * Uses Groq for AI-enhanced recommendations with fallback
 */

import { generateSmartRecommendations, generateQuickRecommendations } from '@/lib/ai/groq.js';
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
    const { riskLevel, temperature, factors, location, useAI = true } = body;

    if (!riskLevel) {
      return NextResponse.json(
        { error: 'Risk level is required' },
        { status: 400 }
      );
    }

    // Get deterministic recommendations as fallback
    const deterministicRecommendations = generateQuickRecommendations(riskLevel, temperature);

    let recommendations = deterministicRecommendations;
    let source = 'deterministic';

    // Use AI for enhanced recommendations if available
    if (useAI && process.env.GROQ_API_KEY) {
      try {
        const riskData = {
          temperature: temperature || 0,
          riskLevel: riskLevel,
          factors: factors || [],
        };
        
        // ✅ generateSmartRecommendations is now exported
        const aiRecommendations = await generateSmartRecommendations(
          riskData, 
          location || { name: 'Selected location' }
        );
        
        // Convert to flat array for response
        const flatRecommendations = [
          ...(aiRecommendations.high || []),
          ...(aiRecommendations.medium || []),
          ...(aiRecommendations.low || []),
          ...(aiRecommendations.general || []),
        ];
        
        if (flatRecommendations.length > 0) {
          recommendations = flatRecommendations;
          source = 'ai';
        }
      } catch (error) {
        console.warn('AI recommendations failed, using deterministic:', error);
        source = 'deterministic-fallback';
      }
    }

    return NextResponse.json({
      success: true,
      recommendations: recommendations,
      source: source,
      riskLevel: riskLevel,
      temperature: temperature,
      metadata: {
        generatedAt: new Date().toISOString(),
        useAI: useAI,
        count: recommendations.length,
      },
    }, {
      headers: getRateLimitHeaders(clientId),
    });

  } catch (error) {
    logError(error, 'Recommendations API');
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
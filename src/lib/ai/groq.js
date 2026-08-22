/**
 * Groq AI Integration
 * Handles AI analysis for risk explanation and recommendations
 */

import Groq from 'groq-sdk';

// Initialize Groq client
let groq = null;

try {
  groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY 
  });
  console.log('[AI] Groq client initialized successfully');
} catch (error) {
  console.error('[AI] Failed to initialize Groq client:', error.message);
}

const DEFAULT_MODEL = 'openai/gpt-oss-20b';

/**
 * Main function to generate risk analysis
 */
export async function generateRiskAnalysis(riskData, locationData) {
  console.log('[AI] generateRiskAnalysis called');
  
  if (!groq) {
    console.warn('[AI] Groq not available, using fallback');
    return getFallbackAnalysis(riskData, locationData);
  }

  try {
    console.log('[AI] Generating analysis with Groq...');
    
    const prompt = getAnalysisPrompt(riskData, locationData);
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are HeatShield AI, a heat risk intelligence assistant. 
                    You MUST ONLY use the provided data. Do NOT invent any information.
                    Keep responses concise and actionable (max 3 paragraphs).
                    If data is missing, clearly state what is unavailable.
                    Always structure your response with clear sections for Explanation, Affected Groups, and Recommendations.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.3,
      max_tokens: 600,
    });

    const analysis = completion.choices[0]?.message?.content || '';
    
    if (!analysis) {
      throw new Error('No analysis returned from Groq');
    }

    console.log('[AI] Analysis received, length:', analysis.length);

    const structured = parseAnalysisResponse(analysis);
    
    return {
      analysis: analysis,
      structured: structured,
      metadata: {
        model: DEFAULT_MODEL,
        timestamp: new Date().toISOString(),
        source: 'groq',
        tokens: completion.usage?.total_tokens || 0,
      },
    };

  } catch (error) {
    console.error('[AI] Groq analysis failed:', error.message);
    return getFallbackAnalysis(riskData, locationData);
  }
}

/**
 * Generate smart recommendations (AI-powered)
 * ✅ EXPORT THIS FUNCTION - It was missing
 */
export async function generateSmartRecommendations(riskData, locationData) {
  console.log('[AI] generateSmartRecommendations called');
  
  if (!groq) {
    console.warn('[AI] Groq not available for recommendations');
    return getFallbackRecommendations(riskData.riskLevel);
  }

  try {
    const prompt = getRecommendationsPrompt(riskData, locationData);
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are HeatShield AI. Provide actionable, prioritized recommendations.
                    Use ONLY the provided data. Group recommendations by priority.
                    Format: High Priority: ..., Medium Priority: ..., Low Priority: ..., General: ...`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.4,
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content || '';
    return parseRecommendationsResponse(content);

  } catch (error) {
    console.error('[AI] Recommendation generation failed:', error);
    return getFallbackRecommendations(riskData.riskLevel);
  }
}

/**
 * Get analysis prompt
 */
function getAnalysisPrompt(riskData, locationData) {
  const {
    temperature,
    exceedanceHours,
    persistenceHours,
    trend,
    environmental,
    riskScore,
    riskLevel,
    factors,
  } = riskData;

  return `
### Heat Risk Analysis Data

**Location:** ${locationData.name || 'Selected location'} (${locationData.latitude}, ${locationData.longitude})

**Current Conditions:**
- Temperature: ${temperature}°C
- Risk Score: ${riskScore}/100
- Risk Level: ${riskLevel}

**Duration:**
- Exceedance Hours: ${exceedanceHours || 0} hours
- Persistence: ${persistenceHours || 0} hours continuous

**Trend:**
- Direction: ${trend?.direction || 'Unknown'}
- Rate: ${trend?.rate || 'N/A'} °C/h

**Risk Factors:**
${factors?.length > 0 ? factors.map(f => `- ${f}`).join('\n') : '- No specific factors identified'}

**Environmental Data:**
${environmental ? `
- Heat Index: ${environmental.heatIndex || 'N/A'}°C
- Humidity: ${environmental.humidity || 'N/A'}%
- Air Quality: ${environmental.airQuality || 'N/A'}
` : '- No environmental data available'}

Based on this data, provide:
1. **Risk Explanation:** Why is this location at risk? What factors are contributing?
2. **Who May Be Affected:** Which groups might be vulnerable?
3. **Recommendations:** What actions should be taken?

Keep it concise, use plain language, and be specific to the data provided.
`;
}

/**
 * Get recommendations prompt
 */
function getRecommendationsPrompt(riskData, locationData) {
  const { temperature, riskLevel, riskScore } = riskData;

  return `
### Heat Risk Data for Recommendations

**Location:** ${locationData.name || 'Selected location'}
**Temperature:** ${temperature}°C
**Risk Level:** ${riskLevel}
**Risk Score:** ${riskScore}/100

Based on this data, provide actionable recommendations grouped by priority:
- **High Priority:** Immediate actions needed
- **Medium Priority:** Important actions to consider
- **Low Priority:** Recommended actions
- **General:** Ongoing monitoring and preparation

Be specific, actionable, and tailored to the ${riskLevel} risk level.
`;
}

/**
 * Parse analysis response into structured sections
 */
function parseAnalysisResponse(analysis) {
  const sections = {
    explanation: '',
    affected: '',
    recommendations: '',
  };

  const lines = analysis.split('\n').filter(line => line.trim());
  let currentSection = 'explanation';

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    if (lower.includes('explanation:') || lower.includes('risk explanation:') || lower.includes('why:')) {
      currentSection = 'explanation';
      continue;
    } else if (lower.includes('affected:') || lower.includes('who may be affected:') || lower.includes('groups:')) {
      currentSection = 'affected';
      continue;
    } else if (lower.includes('recommendations:') || lower.includes('what to do:') || lower.includes('actions:')) {
      currentSection = 'recommendations';
      continue;
    }

    const cleanLine = trimmed.replace(/^[-•*]\s*/, '').replace(/^[0-9]+\.\s*/, '');
    if (cleanLine && !cleanLine.match(/^(explanation|affected|recommendations)/i)) {
      sections[currentSection] += (sections[currentSection] ? ' ' : '') + cleanLine;
    }
  }

  if (!sections.explanation && !sections.affected && !sections.recommendations) {
    const paragraphs = analysis.split('\n\n').filter(p => p.trim());
    if (paragraphs.length >= 3) {
      sections.explanation = paragraphs[0].trim();
      sections.affected = paragraphs[1].trim();
      sections.recommendations = paragraphs[2].trim();
    } else if (paragraphs.length === 1) {
      sections.explanation = paragraphs[0].trim();
    }
  }

  return sections;
}

/**
 * Parse recommendations response
 */
function parseRecommendationsResponse(content) {
  const recommendations = {
    high: [],
    medium: [],
    low: [],
    general: [],
  };

  const lines = content.split('\n').filter(line => line.trim());
  let currentPriority = 'general';

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    if (lower.includes('high priority') || lower.includes('urgent') || lower.includes('immediate')) {
      currentPriority = 'high';
      continue;
    } else if (lower.includes('medium priority') || lower.includes('important')) {
      currentPriority = 'medium';
      continue;
    } else if (lower.includes('low priority') || lower.includes('consider')) {
      currentPriority = 'low';
      continue;
    }

    const cleanLine = trimmed.replace(/^[-•*]\s*/, '').replace(/^[0-9]+\.\s*/, '');
    if (cleanLine && !cleanLine.match(/^(high|medium|low|priority)/i)) {
      recommendations[currentPriority].push(cleanLine);
    }
  }

  return recommendations;
}

/**
 * Fallback analysis when Groq is unavailable
 */
function getFallbackAnalysis(riskData, locationData) {
  const { temperature, riskLevel, factors, exceedanceHours, persistenceHours } = riskData;
  
  let explanation = `This location (${locationData.name || 'Selected location'}) is experiencing ${riskLevel?.toLowerCase() || 'moderate'} heat conditions with temperatures reaching ${temperature || '--'}°C. `;
  
  if (exceedanceHours > 0) {
    explanation += `The temperature has been above threshold for ${exceedanceHours} hours. `;
  }
  
  if (persistenceHours > 0) {
    explanation += `Heat has persisted for ${persistenceHours} hours continuously. `;
  }
  
  if (factors && factors.length > 0) {
    explanation += `Key risk factors include: ${factors.slice(0, 3).join(', ')}.`;
  }
  
  const affected = 'Outdoor workers, older adults, children, and individuals with prolonged outdoor exposure may be at elevated risk.';
  
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
    metadata: {
      source: 'fallback',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Fallback recommendations
 */
function getFallbackRecommendations(riskLevel) {
  const recommendations = {
    high: [],
    medium: [],
    low: [],
    general: [],
  };

  const riskMap = {
    CRITICAL: {
      high: [
        'Avoid all non-essential outdoor activities immediately',
        'Seek immediate cooling if outdoors',
      ],
      medium: [
        'Stay in air-conditioned spaces',
        'Drink water frequently',
        'Watch for signs of heat stroke',
      ],
      low: [],
      general: ['Check on vulnerable individuals immediately'],
    },
    HIGH: {
      high: [
        'Avoid outdoor activities during peak heat (12-4 PM)',
        'Stay in air-conditioned spaces when possible',
      ],
      medium: [
        'Drink water every 15-20 minutes if outdoors',
        'Monitor for signs of heat exhaustion',
      ],
      low: [],
      general: ['Check on elderly and vulnerable neighbors'],
    },
    MEDIUM: {
      high: [],
      medium: [
        'Limit outdoor activities during peak hours (12-4 PM)',
        'Increase water intake',
      ],
      low: [
        'Seek shade when outdoors',
        'Check on vulnerable individuals',
      ],
      general: [],
    },
    LOW: {
      high: [],
      medium: [],
      low: [
        'Continue monitoring temperature conditions',
        'Stay hydrated if outdoors',
      ],
      general: ['Check forecast for potential changes'],
    },
  };

  const levelMap = riskMap[riskLevel] || riskMap.MEDIUM;
  return {
    ...recommendations,
    high: levelMap.high || [],
    medium: levelMap.medium || [],
    low: levelMap.low || [],
    general: levelMap.general || [],
  };
}

/**
 * Quick recommendations (deterministic fallback)
 */
export function generateQuickRecommendations(riskLevel, temperature) {
  const recommendations = {
    LOW: [
      'Continue monitoring temperature conditions',
      'Stay hydrated if outdoors',
      'Check forecast for potential changes',
    ],
    MEDIUM: [
      'Limit outdoor activities during peak hours (12-4 PM)',
      'Increase water intake',
      'Seek shade when outdoors',
      'Check on vulnerable individuals',
    ],
    HIGH: [
      'Avoid outdoor activities during peak heat',
      'Stay in air-conditioned spaces when possible',
      'Drink water every 15-20 minutes if outdoors',
      'Monitor for signs of heat exhaustion',
      'Check on elderly and vulnerable neighbors',
    ],
    CRITICAL: [
      'Avoid all non-essential outdoor activities',
      'Seek immediate cooling if outdoors',
      'Stay in air-conditioned spaces',
      'Drink water frequently',
      'Watch for signs of heat stroke',
      'Emergency response may be needed',
      'Check on elderly and vulnerable individuals immediately',
    ],
  };

  return recommendations[riskLevel] || recommendations.LOW;
}
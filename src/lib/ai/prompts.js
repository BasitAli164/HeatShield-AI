/**
 * AI Prompt Templates
 * Enhanced with better structure and context
 */

/**
 * Get analysis prompt
 */
export function getAnalysisPrompt(riskData, locationData) {
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
export function getRecommendationsPrompt(riskData, locationData) {
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
 * Get vulnerability prompt
 */
export function getVulnerabilityPrompt(riskData, locationData) {
  const { temperature, riskLevel } = riskData;

  return `
### Vulnerability Assessment Data

**Location:** ${locationData.name || 'Selected location'}
**Temperature:** ${temperature}°C
**Risk Level:** ${riskLevel}

Based on this data, identify:
1. **Potentially Affected Groups:** Who may be at risk?
2. **Key Vulnerabilities:** What makes them vulnerable?

IMPORTANT: 
- ONLY use general descriptions
- Do NOT claim specific population numbers
- Label clearly as "Potentially affected groups"
- Be general and factual
`;
}
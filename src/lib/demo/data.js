/**
 * Demo data generator for HeatShield AI
 * Provides realistic sample data for demo mode
 */

const US_CITIES = {
  'Phoenix, AZ': { lat: 33.4484, lng: -112.0740 },
  'Las Vegas, NV': { lat: 36.1699, lng: -115.1398 },
  'Miami, FL': { lat: 25.7617, lng: -80.1918 },
  'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
  'Houston, TX': { lat: 29.7604, lng: -95.3698 },
  'New York, NY': { lat: 40.7128, lng: -74.0060 },
  'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
  'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
};

export function generateDemoHeatmapData(city = 'Phoenix, AZ') {
  const location = US_CITIES[city] || US_CITIES['Phoenix, AZ'];
  const baseTemp = 32 + Math.random() * 10;
  
  // Generate a grid of temperature points around the city
  const points = [];
  const numPoints = 50;
  const spread = 0.05; // ~5km spread

  for (let i = 0; i < numPoints; i++) {
    const latOffset = (Math.random() - 0.5) * spread;
    const lngOffset = (Math.random() - 0.5) * spread;
    const temp = baseTemp + (Math.random() - 0.5) * 8;
    
    points.push({
      latitude: location.lat + latOffset,
      longitude: location.lng + lngOffset,
      temperature: Math.round(temp * 10) / 10,
    });
  }

  return {
    type: 'FeatureCollection',
    features: points.map(point => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude],
      },
      properties: {
        temperature: point.temperature,
        riskScore: calculateDemoRiskScore(point.temperature),
      },
    })),
    metadata: {
      city,
      generatedAt: new Date().toISOString(),
      numPoints,
    },
  };
}

function calculateDemoRiskScore(temperature) {
  if (temperature >= 40) return 80 + Math.random() * 20;
  if (temperature >= 35) return 60 + Math.random() * 20;
  if (temperature >= 30) return 40 + Math.random() * 20;
  return 20 + Math.random() * 20;
}

export function generateDemoRiskData() {
  const baseTemp = 32 + Math.random() * 10;
  const exceedanceHours = Math.floor(Math.random() * 8) + 1;
  const persistenceHours = Math.floor(Math.random() * 6) + 1;
  
  const riskScore = calculateDemoRiskScore(baseTemp);
  const riskLevel = riskScore >= 80 ? 'CRITICAL' :
                    riskScore >= 60 ? 'HIGH' :
                    riskScore >= 40 ? 'MEDIUM' : 'LOW';

  return {
    temperature: Math.round(baseTemp * 10) / 10,
    riskScore: Math.round(riskScore),
    riskLevel,
    exceedanceHours,
    persistenceHours,
    trend: {
      direction: Math.random() > 0.5 ? 'rising' : 'stable',
      rate: Math.round((Math.random() * 2 + 0.5) * 10) / 10,
    },
    factors: generateRiskFactors(baseTemp, exceedanceHours, persistenceHours),
    environmental: {
      heatIndex: Math.round((baseTemp + 3 + Math.random() * 5) * 10) / 10,
      humidity: Math.round(40 + Math.random() * 40),
      airQuality: Math.round(50 + Math.random() * 50),
    },
  };
}

function generateRiskFactors(temp, exceedance, persistence) {
  const factors = [];
  
  if (temp >= 40) {
    factors.push('Temperature is at critical levels (>40°C)');
  } else if (temp >= 35) {
    factors.push('Temperature is at high risk levels (>35°C)');
  } else if (temp >= 30) {
    factors.push('Temperature is at moderate risk levels (>30°C)');
  }
  
  if (exceedance >= 6) {
    factors.push(`Prolonged heat exposure (${exceedance} hours of exceedance)`);
  } else if (exceedance >= 4) {
    factors.push(`Extended heat exposure (${exceedance} hours of exceedance)`);
  }
  
  if (persistence >= 4) {
    factors.push(`Sustained heat (${persistence} hours continuous)`);
  } else if (persistence >= 2) {
    factors.push(`Persistent heat (${persistence} hours continuous)`);
  }
  
  return factors;
}

export function generateHistoricalData() {
  const data = [];
  const now = new Date();
  
  for (let i = 24; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);
    
    const baseTemp = 30 + Math.sin(i / 6) * 5 + Math.random() * 2;
    data.push({
      time: date.toISOString(),
      temperature: Math.round(baseTemp * 10) / 10,
    });
  }
  
  return data;
}

export function generateForecastData() {
  const data = [];
  const now = new Date();
  
  for (let i = 1; i <= 12; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() + i);
    
    const baseTemp = 32 + Math.sin((i + 6) / 6) * 3 + Math.random() * 1.5;
    data.push({
      time: date.toISOString(),
      temperature: Math.round(baseTemp * 10) / 10,
      confidence: Math.max(80 - i * 2, 50),
    });
  }
  
  return data;
}

export const DEMO_CITIES = Object.keys(US_CITIES);
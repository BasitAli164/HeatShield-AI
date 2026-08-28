'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Users, 
  Building, 
  Umbrella,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Sparkles,
  Thermometer
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Helper function to clean AI text
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/_/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// ✅ Helper to format recommendation text
const formatRecommendation = (text) => {
  if (!text) return '';
  let cleaned = cleanText(text);
  cleaned = cleaned.replace(/^[-•*]\s*/, '').replace(/^[0-9]+\.\s*/, '');
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
};

// ✅ Generate recommendations based on risk level and temperature
const generateRecommendations = (riskLevel, temperature) => {
  // ✅ Ensure temperature is a valid number
  const temp = typeof temperature === 'number' ? temperature : parseFloat(temperature) || 0;
  
  const recommendations = {
    high: [],
    medium: [],
    low: [],
    general: [],
  };

  // ✅ Temperature-based recommendations (using actual temperature)
  if (temp >= 40) {
    recommendations.high.push('Seek immediate cooling - temperature exceeds 40°C');
    recommendations.high.push('Avoid all non-essential outdoor activities');
    recommendations.high.push('Emergency response may be needed');
  } else if (temp >= 35) {
    recommendations.high.push('Avoid outdoor activities during peak heat (12-4 PM)');
    recommendations.medium.push('Stay in air-conditioned spaces when possible');
    recommendations.medium.push('Drink water every 15-20 minutes if outdoors');
  } else if (temp >= 30) {
    recommendations.medium.push('Limit outdoor activities during peak hours (12-4 PM)');
    recommendations.medium.push('Increase water intake');
    recommendations.low.push('Seek shade when outdoors');
  } else if (temp >= 25) {
    recommendations.low.push('Stay hydrated if outdoors');
    recommendations.low.push('Check on vulnerable individuals');
  } else {
    recommendations.general.push('Continue monitoring temperature conditions');
  }

  // ✅ Risk level based recommendations
  if (riskLevel === 'CRITICAL') {
    recommendations.high.push('Watch for signs of heat stroke');
    recommendations.high.push('Check on vulnerable individuals immediately');
    recommendations.medium.push('Stay in air-conditioned spaces at all times');
  } else if (riskLevel === 'HIGH') {
    recommendations.medium.push('Monitor for signs of heat exhaustion');
    recommendations.medium.push('Check on elderly and vulnerable neighbors');
    recommendations.low.push('Stay hydrated and cool');
  } else if (riskLevel === 'MEDIUM') {
    recommendations.low.push('Check on vulnerable individuals');
    recommendations.low.push('Stay hydrated');
    recommendations.general.push('Be aware of heat warnings');
  }

  // ✅ General recommendations
  recommendations.general.push('Stay informed about weather conditions');
  recommendations.general.push('Plan activities during cooler hours');

  return recommendations;
};

export default function Recommendations({ 
  riskLevel = 'LOW', 
  temperature,
  isLoading = false,
  className = '',
}) {
  const [recommendations, setRecommendations] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isAiEnhanced, setIsAiEnhanced] = useState(false);

  // ✅ Log the received temperature for debugging
  console.log('[Recommendations] Received temperature:', temperature, 'Risk Level:', riskLevel);

  useEffect(() => {
    if (riskLevel && !isLoading) {
      // Use deterministic recommendations based on risk level and temperature
      const deterministicRecs = generateRecommendations(riskLevel, temperature);
      setRecommendations(deterministicRecs);
      setIsAiEnhanced(false);
      
      // Try to fetch AI enhanced recommendations
      fetchRecommendations();
    }
  }, [riskLevel, temperature, isLoading]);

  const fetchRecommendations = async () => {
    if (!riskLevel) return;
    
    setIsFetching(true);
    try {
      // ✅ Ensure temperature is passed as a number
      const tempValue = typeof temperature === 'number' ? temperature : parseFloat(temperature) || 0;
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskLevel: riskLevel,
          temperature: tempValue,  // ✅ Pass the actual temperature
          useAI: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          // Format and categorize recommendations
          const formatted = {
            high: [],
            medium: [],
            low: [],
            general: [],
          };
          
          const cleaned = data.recommendations.map(r => formatRecommendation(r)).filter(r => r);
          
          cleaned.forEach((rec, index) => {
            const lower = rec.toLowerCase();
            if (lower.includes('immediate') || lower.includes('urgent') || lower.includes('emergency') || lower.includes('avoid') || lower.includes('seek')) {
              formatted.high.push(rec);
            } else if (lower.includes('monitor') || lower.includes('check') || lower.includes('watch') || lower.includes('limit') || lower.includes('stay')) {
              formatted.medium.push(rec);
            } else if (lower.includes('consider') || lower.includes('plan') || lower.includes('prepare') || lower.includes('hydrate')) {
              formatted.low.push(rec);
            } else {
              formatted.general.push(rec);
            }
          });
          
          const totalAI = Object.values(formatted).reduce((sum, arr) => sum + arr.length, 0);
          if (totalAI > 0) {
            setRecommendations(formatted);
            setIsAiEnhanced(data.source === 'ai');
          }
        }
      }
    } catch (error) {
      console.warn('AI recommendations failed, using deterministic:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const displayRecommendations = isLoading || isFetching 
    ? generateRecommendations(riskLevel, temperature) 
    : recommendations || generateRecommendations(riskLevel, temperature);

  const hasRecommendations = Object.values(displayRecommendations).some(arr => arr.length > 0);
  const totalCount = Object.values(displayRecommendations).reduce((sum, arr) => sum + arr.length, 0);

  const PRIORITY_CONFIG = {
    high: { label: 'High Priority', color: 'text-red-600 bg-red-50 border-red-200', icon: Flame },
    medium: { label: 'Medium Priority', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertCircle },
    low: { label: 'Low Priority', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CheckCircle2 },
    general: { label: 'General', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: Shield },
  };

  // ✅ Show temperature badge
  const tempDisplay = typeof temperature === 'number' ? temperature.toFixed(1) : temperature || '--';

  if (!hasRecommendations && !isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Shield className="h-4 w-4 mr-2 text-blue-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-slate-500">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recommendations available</p>
              <p className="text-xs mt-1">Analyze a location to get recommendations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-500" />
              Recommendations
              {(isLoading || isFetching) && (
                <Loader2 className="h-3 w-3 ml-2 animate-spin text-slate-400" />
              )}
            </CardTitle>
            {isAiEnhanced && !isLoading && !isFetching && (
              <Badge variant="outline" className="text-[10px] text-green-500 border-green-200">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                AI Enhanced
              </Badge>
            )}
            {totalCount > 0 && !isLoading && !isFetching && (
              <Badge variant="outline" className="text-[10px] text-slate-500">
                {totalCount} actions
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded && (
          <div className="space-y-3">
            {/* ✅ Temperature Display */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-3.5 w-3.5 text-red-500" />
                <span>Current Temperature:</span>
              </div>
              <span className="font-bold text-slate-900">{tempDisplay}°C</span>
            </div>

            {Object.entries(displayRecommendations).map(([priority, items]) => {
              if (!items || items.length === 0) return null;
              
              const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.general;
              const Icon = config.icon;
              
              const cleanItems = items.map(item => formatRecommendation(item)).filter(item => item);
              
              if (cleanItems.length === 0) return null;
              
              return (
                <div key={priority} className={cn("rounded-lg p-3 border", config.color)}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{config.label}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {cleanItems.length} {cleanItems.length === 1 ? 'action' : 'actions'}
                    </Badge>
                  </div>
                  <ul className="space-y-1.5">
                    {cleanItems.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-slate-700">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
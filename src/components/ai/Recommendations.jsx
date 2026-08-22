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
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Helper function to clean AI text
const cleanText = (text) => {
  if (!text) return '';
  // Remove markdown formatting
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
  // Remove leading dash, bullet, or number
  cleaned = cleaned.replace(/^[-•*]\s*/, '').replace(/^[0-9]+\.\s*/, '');
  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
};

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: 'text-red-600 bg-red-50 border-red-200', icon: Flame },
  medium: { label: 'Medium Priority', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertCircle },
  low: { label: 'Low Priority', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CheckCircle2 },
  general: { label: 'General', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: Shield },
};

const FALLBACK_RECOMMENDATIONS = {
  high: [
    'Avoid all non-essential outdoor activities',
    'Seek immediate cooling if outdoors',
    'Watch for signs of heat stroke',
  ],
  medium: [
    'Stay in air-conditioned spaces when possible',
    'Drink water every 15-20 minutes if outdoors',
    'Monitor for signs of heat exhaustion',
  ],
  low: [
    'Check on elderly and vulnerable neighbors',
    'Stay hydrated throughout the day',
    'Limit outdoor activities during peak hours',
  ],
  general: [
    'Stay informed about weather conditions',
    'Plan activities during cooler hours',
  ],
};

export default function Recommendations({ 
  riskLevel = 'LOW', 
  temperature,
  isLoading = false,
  className = '',
}) {
  const [recommendations, setRecommendations] = useState(FALLBACK_RECOMMENDATIONS);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isAiEnhanced, setIsAiEnhanced] = useState(false);

  useEffect(() => {
    if (riskLevel && !isLoading) {
      fetchRecommendations();
    }
  }, [riskLevel, temperature, isLoading]);

  const fetchRecommendations = async () => {
    if (!riskLevel) return;
    
    setIsFetching(true);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskLevel: riskLevel,
          temperature: temperature || 0,
          useAI: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.recommendations) {
          if (Array.isArray(data.recommendations)) {
            // Format and categorize recommendations
            const formatted = {
              high: [],
              medium: [],
              low: [],
              general: [],
            };
            
            // Clean each recommendation
            const cleaned = data.recommendations.map(r => formatRecommendation(r)).filter(r => r);
            
            // Distribute based on content hints or evenly
            cleaned.forEach((rec, index) => {
              const lower = rec.toLowerCase();
              if (lower.includes('immediate') || lower.includes('urgent') || lower.includes('emergency') || lower.includes('avoid')) {
                formatted.high.push(rec);
              } else if (lower.includes('monitor') || lower.includes('check') || lower.includes('watch') || lower.includes('limit')) {
                formatted.medium.push(rec);
              } else if (lower.includes('consider') || lower.includes('plan') || lower.includes('prepare')) {
                formatted.low.push(rec);
              } else {
                // Distribute remaining evenly
                if (index % 4 === 0) formatted.high.push(rec);
                else if (index % 4 === 1) formatted.medium.push(rec);
                else if (index % 4 === 2) formatted.low.push(rec);
                else formatted.general.push(rec);
              }
            });
            
            setRecommendations(formatted);
            setIsAiEnhanced(data.source === 'ai');
          } else {
            // Handle structured recommendations
            const formatted = {
              high: (data.recommendations.high || []).map(r => formatRecommendation(r)).filter(r => r),
              medium: (data.recommendations.medium || []).map(r => formatRecommendation(r)).filter(r => r),
              low: (data.recommendations.low || []).map(r => formatRecommendation(r)).filter(r => r),
              general: (data.recommendations.general || []).map(r => formatRecommendation(r)).filter(r => r),
            };
            setRecommendations(formatted);
            setIsAiEnhanced(data.source === 'ai');
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch recommendations, using fallback:', error);
      setRecommendations(FALLBACK_RECOMMENDATIONS);
      setIsAiEnhanced(false);
    } finally {
      setIsFetching(false);
    }
  };

  const displayRecommendations = isLoading || isFetching ? FALLBACK_RECOMMENDATIONS : recommendations;

  // Filter out empty priority groups
  const hasRecommendations = Object.values(displayRecommendations).some(arr => arr.length > 0);

  // Count total recommendations
  const totalCount = Object.values(displayRecommendations).reduce((sum, arr) => sum + arr.length, 0);

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
            {Object.entries(displayRecommendations).map(([priority, items]) => {
              if (!items || items.length === 0) return null;
              
              const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.general;
              const Icon = config.icon;
              
              // Clean and format each item
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
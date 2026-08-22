'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import RiskLevelBadge from './RiskLevelBadge';
import { AlertTriangle, TrendingUp, Clock, Thermometer } from 'lucide-react';

export default function RiskScore({ 
  score, 
  level, 
  factors = [], 
  isLoading = false,
  showDetails = true,
}) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on change
  useEffect(() => {
    if (!isLoading && score !== undefined) {
      let start = 0;
      const duration = 1000;
      const steps = 60;
      const increment = score / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.round(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [score, isLoading]);

  const getScoreColor = (value) => {
    if (value >= 80) return 'bg-red-500';
    if (value >= 60) return 'bg-orange-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getScoreDescription = (value) => {
    if (value >= 80) return 'Critical - Immediate action required';
    if (value >= 60) return 'High - Significant risk present';
    if (value >= 40) return 'Medium - Moderate risk';
    return 'Low - Minimal risk';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
            <div className="h-2 bg-slate-100 animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-8 bg-slate-100 animate-pulse rounded"></div>
              <div className="h-8 bg-slate-100 animate-pulse rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
          Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-slate-900">
                {animatedScore}
              </span>
              {level && <RiskLevelBadge level={level} />}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {getScoreDescription(score)}
            </p>
          </div>
          <div className="text-4xl">
            {score >= 80 ? '🔴' : score >= 60 ? '🟠' : score >= 40 ? '🟡' : '🟢'}
          </div>
        </div>

        <Progress 
          value={score} 
          className="h-2 bg-slate-100" 
          indicatorClassName={getScoreColor(score)}
        />

        {showDetails && factors && factors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-2">Key Risk Factors:</p>
            <ul className="space-y-1">
              {factors.slice(0, 3).map((factor, index) => (
                <li key={index} className="text-sm text-slate-700 flex items-start space-x-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span className="line-clamp-2">{factor}</span>
                </li>
              ))}
              {factors.length > 3 && (
                <li className="text-sm text-slate-500 italic">
                  +{factors.length - 3} more factors
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-slate-200">
          <div className="text-center">
            <Thermometer className="h-4 w-4 mx-auto text-slate-400" />
            <p className="text-xs text-slate-500 mt-1">Temperature</p>
          </div>
          <div className="text-center">
            <Clock className="h-4 w-4 mx-auto text-slate-400" />
            <p className="text-xs text-slate-500 mt-1">Duration</p>
          </div>
          <div className="text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-slate-400" />
            <p className="text-xs text-slate-500 mt-1">Trend</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
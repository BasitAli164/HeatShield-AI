'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Card as UICard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Calendar,
  Thermometer,
  AlertTriangle
} from 'lucide-react';
import { getTemperatureColor, formatTemperature } from '@/lib/geo/heatmap-utils';

export default function TrendChart({ 
  historicalData = [],
  forecastData = [],
  currentTemp = null,
  trend = null,
  isLoading = false,
}) {
  // Calculate trend statistics
  const calculateTrendStats = () => {
    if (!historicalData || historicalData.length < 2) return null;
    
    const temps = historicalData.map(d => d.temperature);
    const first = temps[0];
    const last = temps[temps.length - 1];
    const diff = last - first;
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    const max = Math.max(...temps);
    const min = Math.min(...temps);
    
    const hours = (new Date(historicalData[historicalData.length - 1].time) - new Date(historicalData[0].time)) / (1000 * 60 * 60);
    const rate = diff / (hours || 1);
    
    return {
      first,
      last,
      diff,
      avg,
      max,
      min,
      rate,
      hours,
      direction: diff > 0.5 ? 'rising' : diff < -0.5 ? 'falling' : 'stable',
    };
  };

  const stats = calculateTrendStats();

  if (isLoading) {
    return (
      <UICard>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-slate-100 animate-pulse rounded-lg"></div>
        </CardContent>
      </UICard>
    );
  }

  if (!stats) {
    return (
      <UICard>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-slate-400">
            <div className="text-center">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No trend data available</p>
            </div>
          </div>
        </CardContent>
      </UICard>
    );
  }

  const trendConfigs = {
    rising: { 
      icon: TrendingUp, 
      color: 'text-red-500', 
      bg: 'bg-red-50', 
      label: 'Warming Trend',
      description: 'Temperatures are increasing',
    },
    falling: { 
      icon: TrendingDown, 
      color: 'text-green-500', 
      bg: 'bg-green-50', 
      label: 'Cooling Trend',
      description: 'Temperatures are decreasing',
    },
    stable: { 
      icon: Minus, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50', 
      label: 'Stable Trend',
      description: 'Temperatures are holding steady',
    },
  };

  const trendConfig = trendConfigs[stats.direction] || trendConfigs.stable;
  const TrendIcon = trendConfig.icon;

  // Get forecast summary
  const getForecastSummary = () => {
    if (!forecastData || forecastData.length === 0) return null;
    
    const temps = forecastData.map(d => d.temperature);
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    const max = Math.max(...temps);
    const min = Math.min(...temps);
    
    return { avg, max, min };
  };

  const forecastSummary = getForecastSummary();

  return (
    <UICard>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <TrendIcon className={`h-4 w-4 mr-2 ${trendConfig.color}`} />
          Trend Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Trend Overview */}
        <div className={`p-3 rounded-lg ${trendConfig.bg} border ${trendConfig.color.replace('text', 'border')} border-opacity-20`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${trendConfig.color}`}>{trendConfig.label}</p>
              <p className="text-xs text-slate-600">{trendConfig.description}</p>
            </div>
            <Badge className={`${trendConfig.bg} ${trendConfig.color} border-0`}>
              {stats.rate > 0 ? '+' : ''}{stats.rate.toFixed(1)}°C/h
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-[10px] text-slate-500">Start</p>
            <p className="font-bold text-slate-900">{stats.first.toFixed(1)}°</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-[10px] text-slate-500">Current</p>
            <p className="font-bold text-slate-900">{stats.last.toFixed(1)}°</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-[10px] text-slate-500">Change</p>
            <p className={`font-bold ${stats.diff > 0 ? 'text-red-500' : stats.diff < 0 ? 'text-green-500' : 'text-slate-500'}`}>
              {stats.diff > 0 ? '+' : ''}{stats.diff.toFixed(1)}°
            </p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-[10px] text-slate-500">Average</p>
            <p className="font-bold text-slate-900">{stats.avg.toFixed(1)}°</p>
          </div>
        </div>

        {/* Forecast Summary */}
        {forecastSummary && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Forecast Summary (12h)
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1.5 bg-blue-50 rounded-lg">
                <p className="text-[10px] text-slate-500">Avg</p>
                <p className="font-semibold text-blue-600">{forecastSummary.avg.toFixed(1)}°</p>
              </div>
              <div className="text-center p-1.5 bg-red-50 rounded-lg">
                <p className="text-[10px] text-slate-500">Max</p>
                <p className="font-semibold text-red-600">{forecastSummary.max.toFixed(1)}°</p>
              </div>
              <div className="text-center p-1.5 bg-green-50 rounded-lg">
                <p className="text-[10px] text-slate-500">Min</p>
                <p className="font-semibold text-green-600">{forecastSummary.min.toFixed(1)}°</p>
              </div>
            </div>
          </div>
        )}

        {/* Risk Indication */}
        {currentTemp && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">Current Risk Level</span>
            </div>
            <Badge 
              className={currentTemp >= 40 ? 'bg-red-500 text-white' : 
                         currentTemp >= 35 ? 'bg-orange-500 text-white' :
                         currentTemp >= 30 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}
            >
              {currentTemp >= 40 ? 'CRITICAL' : 
               currentTemp >= 35 ? 'HIGH' :
               currentTemp >= 30 ? 'MEDIUM' : 'LOW'}
            </Badge>
          </div>
        )}
      </CardContent>
    </UICard>
  );
}
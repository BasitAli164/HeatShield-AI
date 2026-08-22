'use client';

import React from 'react';
import { Popup } from 'react-leaflet';
import { getTemperatureColor, formatTemperature, getTemperatureEmoji } from '@/lib/geo/heatmap-utils';

export default function MapPopup({ 
  feature, 
  onAnalyze,
  className = '',
}) {
  if (!feature || !feature.properties) return null;

  const temp = feature.properties.temperature;
  const riskScore = feature.properties.riskScore;
  const color = getTemperatureColor(temp);
  const emoji = getTemperatureEmoji(temp);

  const handleAnalyze = (e) => {
    e.stopPropagation();
    if (onAnalyze) {
      const coords = feature.geometry.coordinates;
      onAnalyze({
        latitude: coords[1],
        longitude: coords[0],
        temperature: temp,
        riskScore: riskScore,
        ...feature.properties,
      });
    }
  };

  return (
    <Popup className={className}>
      <div className="p-2 min-w-[180px]">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">{emoji}</span>
          <p className="font-bold text-slate-900">
            {formatTemperature(temp)}
          </p>
          <span 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        </div>
        
        {riskScore !== undefined && riskScore !== null && (
          <div className="mb-2">
            <p className="text-sm text-slate-500">Risk Score</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, riskScore)}%`,
                    backgroundColor: riskScore >= 70 ? '#ef4444' : 
                                    riskScore >= 50 ? '#f97316' : 
                                    riskScore >= 30 ? '#eab308' : '#22c55e'
                  }}
                />
              </div>
              <span className="text-xs font-medium">{riskScore}/100</span>
            </div>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between">
          <p className="text-xs text-slate-400">
            {feature.geometry.coordinates[1].toFixed(4)}, 
            {feature.geometry.coordinates[0].toFixed(4)}
          </p>
          <button
            onClick={handleAnalyze}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Analyze →
          </button>
        </div>
      </div>
    </Popup>
  );
}
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { getTemperatureColor, getTemperatureLabel, getTemperatureEmoji } from '@/lib/geo/heatmap-utils';

const TEMPERATURE_RANGES = [
  { min: 40, max: 50, label: 'Extreme Heat' },
  { min: 35, max: 39.9, label: 'Very Hot' },
  { min: 30, max: 34.9, label: 'Hot' },
  { min: 25, max: 29.9, label: 'Warm' },
  { min: 20, max: 24.9, label: 'Mild' },
  { min: -10, max: 19.9, label: 'Cool' },
];

export default function MapLegend({ 
  minTemp, 
  maxTemp, 
  hotspots = 0,
  className = '',
  position = 'bottom-left',
}) {
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  return (
    <Card className={`absolute ${positionClasses[position] || positionClasses['bottom-left']} z-10 shadow-lg border-slate-200 w-[180px] ${className}`}>
      <CardContent className="p-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-700 mb-2">Temperature</p>
          {TEMPERATURE_RANGES.map((range, index) => {
            const temp = (range.min + range.max) / 2;
            const color = getTemperatureColor(temp);
            const emoji = getTemperatureEmoji(temp);
            
            return (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-600 flex-1">{emoji} {range.label}</span>
                <span className="text-[10px] text-slate-400">
                  {range.min}°-{range.max}°
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Stats */}
        {(minTemp !== undefined || maxTemp !== undefined || hotspots > 0) && (
          <div className="mt-3 pt-2 border-t border-slate-200">
            <div className="flex justify-between text-[10px] text-slate-500">
              {minTemp !== undefined && minTemp !== null && <span>Min: {minTemp}°</span>}
              {maxTemp !== undefined && maxTemp !== null && <span>Max: {maxTemp}°</span>}
            </div>
            {hotspots > 0 && (
              <div className="text-[10px] text-red-500 text-center mt-1 font-medium">
                🔥 {hotspots} hotspot{hotspots > 1 ? 's' : ''} detected
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
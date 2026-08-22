'use client';

import React, { useState, useEffect } from 'react';
import { Thermometer, MapPin, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getCurrentTimeInCity, getTimezoneAbbreviation } from '@/lib/datetime';

export default function Header({ location, isDemo = false, lastUpdated = '' }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const cityName = location?.name || 'Phoenix, AZ';
      const time = getCurrentTimeInCity(cityName);
      const tz = getTimezoneAbbreviation(cityName);
      setCurrentTime(`${time} ${tz}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [location]);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-2.5 rounded-xl shadow-lg shadow-red-500/20">
              <Thermometer className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                HeatShield AI
              </h1>
              <p className="text-xs text-slate-500">Hyperlocal Heat Intelligence</p>
            </div>
          </div>
          <Badge 
            variant={isDemo ? "outline" : "default"} 
            className={isDemo ? 
              "border-amber-500 text-amber-600 bg-amber-50" : 
              "bg-green-500 text-white shadow-lg shadow-green-500/20"
            }
          >
            {isDemo ? '📊 Demo Mode' : '🟢 Live Mode'}
          </Badge>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">{location?.name || 'Unknown Location'}</span>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            🕐 {currentTime || lastUpdated}
          </div>
        </div>
      </div>
    </header>
  );
}
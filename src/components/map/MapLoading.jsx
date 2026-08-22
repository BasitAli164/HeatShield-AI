'use client';

import React from 'react';
import { Loader2, MapPin } from 'lucide-react';

export default function MapLoading({ 
  message = 'Loading map data...',
  subMessage = 'Please wait while we load the heatmap',
  className = '',
}) {
  return (
    <div className={`h-[400px] w-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 mx-auto bg-white rounded-full shadow-lg flex items-center justify-center">
            <MapPin className="h-8 w-8 text-red-500 animate-bounce" />
          </div>
          <div className="absolute -inset-4">
            <div className="w-24 h-24 mx-auto border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-slate-700">{message}</p>
          <p className="text-xs text-slate-500 mt-1">{subMessage}</p>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-150" />
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-300" />
        </div>
      </div>
    </div>
  );
}
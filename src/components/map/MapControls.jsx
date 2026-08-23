'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Crosshair, Layers, RefreshCw, MapPin } from 'lucide-react';

export default function MapControls({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onToggleLayer,
  onRefresh,
  onCenterLocation,
  isLoading = false,
  className = '',
}) {
  return (
    <div className={`absolute top-4 right-4 space-y-1 z-20 ${className}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-1">
        <button
          onClick={onZoomIn}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors text-slate-600 text-lg font-bold"
          title="Zoom In"
          type="button"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors text-slate-600 text-lg font-bold"
          title="Zoom Out"
          type="button"
        >
          −
        </button>
        <div className="border-t border-slate-200 my-1" />
        <button
          onClick={onReset}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors text-slate-600"
          title="Reset View"
          type="button"
        >
          <Crosshair className="h-4 w-4" />
        </button>
        <button
          onClick={onCenterLocation}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors text-slate-600"
          title="Center on Location"
          type="button"
        >
          <MapPin className="h-4 w-4" />
        </button>
        <div className="border-t border-slate-200 my-1" />
        <button
          onClick={onToggleLayer}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors text-slate-600"
          title="Toggle Layers"
          type="button"
        >
          <Layers className="h-4 w-4" />
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors text-slate-600 disabled:opacity-50"
          title="Refresh"
          type="button"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
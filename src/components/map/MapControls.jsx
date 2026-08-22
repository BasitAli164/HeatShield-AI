'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ZoomIn, ZoomOut, Crosshair, Layers, Download, RefreshCw, MapPin } from 'lucide-react';

export default function MapControls({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onToggleLayer,
  onDownload,
  onRefresh,
  onCenterLocation,
  isLoading = false,
  className = '',
}) {
  return (
    <div className={`absolute bottom-4 right-4 space-y-2 z-10 ${className}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 hover:bg-slate-100"
          onClick={onZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 hover:bg-slate-100"
          onClick={onZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="border-t border-slate-200 my-1" />
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 hover:bg-slate-100"
          onClick={onReset}
          title="Reset View"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 hover:bg-slate-100"
          onClick={onCenterLocation}
          title="Center on Location"
        >
          <MapPin className="h-4 w-4" />
        </Button>
        <div className="border-t border-slate-200 my-1" />
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 hover:bg-slate-100"
          onClick={onToggleLayer}
          title="Toggle Layers"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 hover:bg-slate-100"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
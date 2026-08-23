'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Import components
import MapLegend from './MapLegend';
import HotspotMarker from './HotspotMarker';
import MapLoading from './MapLoading';
import MapControls from './MapControls';

// Import utilities
import { 
  getTemperatureColor, 
  getTemperatureRadius, 
  calculateHeatmapStats,
  isHotspot
} from '@/lib/geo/heatmap-utils';

// ✅ Dynamic imports with ssr: false
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// ✅ Helper to safely format coordinates
const formatCoord = (coord) => {
  if (coord === undefined || coord === null || isNaN(coord)) {
    return '--';
  }
  if (typeof coord === 'string') {
    const parsed = parseFloat(coord);
    if (!isNaN(parsed)) {
      return parsed.toFixed(4);
    }
    return '--';
  }
  if (typeof coord === 'number') {
    return coord.toFixed(4);
  }
  return '--';
};

// ✅ Helper to get latitude from center
const getCenterLat = (center) => {
  if (!center) return 33.4484;
  if (Array.isArray(center)) {
    return typeof center[0] === 'number' ? center[0] : 33.4484;
  }
  if (typeof center === 'object') {
    return center.lat || center.latitude || 33.4484;
  }
  return 33.4484;
};

// ✅ Helper to get longitude from center
const getCenterLng = (center) => {
  if (!center) return -112.0740;
  if (Array.isArray(center)) {
    return typeof center[1] === 'number' ? center[1] : -112.0740;
  }
  if (typeof center === 'object') {
    return center.lng || center.longitude || -112.0740;
  }
  return -112.0740;
};

// Main HeatMap Component
export default function HeatMap({ 
  geojsonData, 
  center = [33.4484, -112.0740], 
  zoom = 12,
  onLocationSelect = null,
  onHotspotSelect = null,
  onMapMove = null,
  isLoading = false,
  className = '',
  showControls = true,
  showLegend = true,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState(null);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState({ min: null, max: null, mean: null, count: 0, hotspots: 0 });

  // ✅ Generate unique key for map - changes when center changes
  const mapKey = useMemo(() => {
    const lat = getCenterLat(center);
    const lng = getCenterLng(center);
    return `map-${lat}-${lng}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }, [center]);

  // ✅ Load Leaflet on client
  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet);
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  // ✅ CRITICAL: Cleanup map on unmount and when center changes
  useEffect(() => {
    // ✅ This runs when component mounts or center changes
    
    // ✅ Return cleanup function
    return () => {
      // ✅ Completely destroy the map instance
      if (mapRef.current) {
        try {
          // ✅ Remove the map from DOM
          mapRef.current.remove();
          mapRef.current = null;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      // ✅ Clear the container's inner HTML to remove any leftover map elements
      if (containerRef.current) {
        try {
          containerRef.current.innerHTML = '';
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [center]); // ✅ Re-run cleanup when center changes

  // Calculate statistics and hotspots from GeoJSON
  useEffect(() => {
    if (geojsonData && geojsonData.features) {
      const calculatedStats = calculateHeatmapStats(geojsonData);
      setStats(calculatedStats);
      
      const hotFeatures = geojsonData.features.filter(
        f => f.properties?.temperature && isHotspot(f.properties.temperature)
      );
      setHotspots(hotFeatures);
    } else {
      setStats({ min: null, max: null, mean: null, count: 0, hotspots: 0 });
      setHotspots([]);
    }
  }, [geojsonData]);

  // Point to layer function for GeoJSON
  const pointToLayer = useCallback((feature, latlng) => {
    if (!L) return null;
    
    const temp = feature.properties?.temperature || 25;
    const color = getTemperatureColor(temp);
    const radius = getTemperatureRadius(temp);
    
    return L.circleMarker(latlng, {
      radius: radius,
      fillColor: color,
      color: color,
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.6,
    });
  }, [L]);

  // Style function for GeoJSON features
  const style = useCallback((feature) => {
    const temp = feature.properties?.temperature || 25;
    const color = getTemperatureColor(temp);
    return {
      fillColor: color,
      color: color,
      weight: 0.5,
      opacity: 0.8,
      fillOpacity: 0.5,
      radius: getTemperatureRadius(temp),
    };
  }, []);

  // On each feature function
  const onEachFeature = useCallback((feature, layer) => {
    if (feature.properties && feature.properties.temperature) {
      const temp = feature.properties.temperature;
      const riskScore = feature.properties.riskScore;
      
      const coords = feature.geometry?.coordinates || [];
      const lat = coords.length > 1 ? coords[1] : null;
      const lng = coords.length > 0 ? coords[0] : null;
      
      layer.bindPopup(`
        <div class="p-2 min-w-[180px]">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-2xl">${temp >= 40 ? '🔥' : temp >= 35 ? '🌡️' : temp >= 30 ? '☀️' : '🌤️'}</span>
            <p class="font-bold text-slate-900">${temp}°C</p>
            <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${getTemperatureColor(temp)}"></span>
          </div>
          ${riskScore ? `
            <div class="mb-2">
              <p class="text-sm text-slate-500">Risk Score</p>
              <div class="flex items-center space-x-2">
                <div class="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" style="width: ${Math.min(100, riskScore)}%; background-color: ${riskScore >= 70 ? '#ef4444' : riskScore >= 50 ? '#f97316' : riskScore >= 30 ? '#eab308' : '#22c55e'}"></div>
                </div>
                <span class="text-xs font-medium">${riskScore}/100</span>
              </div>
            </div>
          ` : ''}
          <div class="mt-2 pt-2 border-t border-slate-200 flex justify-between">
            <p class="text-xs text-slate-400">${formatCoord(lat)}, ${formatCoord(lng)}</p>
          </div>
        </div>
      `);
      
      layer.on('click', () => {
        if (onLocationSelect && feature.geometry) {
          const coords = feature.geometry.coordinates;
          if (coords && coords.length >= 2) {
            onLocationSelect({
              latitude: coords[1],
              longitude: coords[0],
              temperature: temp,
              riskScore: riskScore,
              ...feature.properties,
            });
          }
        }
      });
    }
  }, [onLocationSelect]);

  // Handle hotspot select
  const handleHotspotSelect = useCallback((hotspotData) => {
    if (onHotspotSelect) {
      onHotspotSelect(hotspotData);
    }
    if (onLocationSelect) {
      onLocationSelect(hotspotData);
    }
  }, [onHotspotSelect, onLocationSelect]);

  // ✅ Don't render on server
  if (!isMounted) {
    return <MapLoading message="Loading map..." subMessage="Initializing map component" className={className} />;
  }

  if (isLoading) {
    return <MapLoading message="Loading heatmap data..." subMessage="Fetching temperature data from FortyGuard" className={className} />;
  }

  const centerLat = getCenterLat(center);
  const centerLng = getCenterLng(center);

  return (
    <div 
      ref={containerRef}
      className={`relative h-[400px] w-full rounded-lg overflow-hidden ${className}`}
    >
      {/* ✅ Use key to force re-mount when center changes */}
      <MapContainer
        key={mapKey}
        ref={mapRef}
        center={[centerLat, centerLng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* GeoJSON Data */}
        {geojsonData && geojsonData.features && geojsonData.features.length > 0 ? (
          <GeoJSON
            data={geojsonData}
            pointToLayer={pointToLayer}
            onEachFeature={onEachFeature}
            style={style}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 pointer-events-none">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm">No heatmap data available</p>
              <p className="text-xs mt-1">Click &quot;Analyze Location&quot; to load data</p>
            </div>
          </div>
        )}
        
        {/* Hotspot Markers */}
        {hotspots.map((feature, index) => (
          <HotspotMarker 
            key={index}
            feature={feature}
            onSelect={handleHotspotSelect}
            size="medium"
          />
        ))}
        
        {/* Selected Location Marker */}
        {center && (
          <Marker position={[centerLat, centerLng]}>
            <Popup>
              <div className="text-center">
                <p className="font-bold">📍 Selected Location</p>
                <p className="text-sm text-slate-500">
                  {formatCoord(centerLat)}, {formatCoord(centerLng)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      {/* Legend */}
      {showLegend && (
        <MapLegend 
          minTemp={stats.min}
          maxTemp={stats.max}
          hotspots={stats.hotspots}
          position="bottom-left"
        />
      )}
      
      {/* Map Controls */}
      {showControls && (
        <MapControls
          onZoomIn={() => {
            if (mapRef.current) {
              try {
                mapRef.current.setZoom(mapRef.current.getZoom() + 1);
              } catch (e) {}
            }
          }}
          onZoomOut={() => {
            if (mapRef.current) {
              try {
                mapRef.current.setZoom(mapRef.current.getZoom() - 1);
              } catch (e) {}
            }
          }}
          onReset={() => {
            if (mapRef.current) {
              try {
                mapRef.current.setView([centerLat, centerLng], 12);
              } catch (e) {}
            }
          }}
          onCenterLocation={() => {
            if (mapRef.current) {
              try {
                mapRef.current.setView([centerLat, centerLng], 15);
              } catch (e) {}
            }
          }}
          onToggleLayer={() => {}}
          onRefresh={() => {
            if (onLocationSelect && center) {
              onLocationSelect({
                latitude: centerLat,
                longitude: centerLng,
              });
            }
          }}
          isLoading={isLoading}
        />
      )}
      
      {/* Data Info */}
      {geojsonData && geojsonData.features && geojsonData.features.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 z-10">
          <span className="text-xs text-slate-500">
            {geojsonData.features.length} points • {stats.count} readings
          </span>
        </div>
      )}
    </div>
  );
}
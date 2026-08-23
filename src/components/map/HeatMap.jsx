'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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

// ✅ Helper functions
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
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const innerCircleRef = useRef(null);
  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState({ min: null, max: null, mean: null, count: 0, hotspots: 0 });
  const [markerCreated, setMarkerCreated] = useState(false);

  // ✅ Force map re-mount when center changes
  const mapKey = useMemo(() => {
    const lat = getCenterLat(center);
    const lng = getCenterLng(center);
    return `map-${lat}-${lng}-${Date.now()}`;
  }, [center]);

  useEffect(() => {
    setIsClient(true);
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

  // ✅ Create marker function
  const createMarker = useCallback(() => {
    if (!isClient || !L || !mapRef.current || !center) return;

    const map = mapRef.current;
    const centerLat = getCenterLat(center);
    const centerLng = getCenterLng(center);

    // Remove existing marker and circles
    if (markerRef.current) {
      try {
        markerRef.current.remove();
        markerRef.current = null;
      } catch (e) {}
    }
    if (circleRef.current) {
      try {
        circleRef.current.remove();
        circleRef.current = null;
      } catch (e) {}
    }
    if (innerCircleRef.current) {
      try {
        innerCircleRef.current.remove();
        innerCircleRef.current = null;
      } catch (e) {}
    }

    console.log('[HeatMap] Creating marker for:', centerLat, centerLng);

    // ✅ Create PULSING CIRCLE
    const circle = L.circle([centerLat, centerLng], {
      radius: 30,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.15,
      weight: 2,
      opacity: 0.5,
    });
    circle.addTo(map);
    circleRef.current = circle;

    // ✅ Animate circle using requestAnimationFrame
    let startTime = Date.now();
    let animationId = null;
    const animatePulse = () => {
      if (!circleRef.current) return;
      const elapsed = (Date.now() - startTime) / 1000;
      const pulse = 0.3 + 0.7 * Math.sin(elapsed * 2 * Math.PI / 2);
      const radius = 15 + 30 * (1 - pulse);
      try {
        circleRef.current.setRadius(radius);
      } catch (e) {}
      animationId = requestAnimationFrame(animatePulse);
    };
    animatePulse();

    // ✅ Create RED DOT MARKER
    const icon = L.divIcon({
      className: 'location-marker',
      html: `
        <div style="
          width: 16px;
          height: 16px;
          background-color: #ef4444;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
          position: relative;
          z-index: 10;
          cursor: pointer;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            background-color: white;
            border-radius: 50%;
            opacity: 0.7;
          "></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
    });

    const marker = L.marker([centerLat, centerLng], { icon });
    marker.addTo(map);
    markerRef.current = marker;

    // Bind popup
    marker.bindPopup(`
      <div class="text-center">
        <p class="font-bold text-lg">📍 Selected Location</p>
        <p class="text-sm text-slate-500">${formatCoord(centerLat)}, ${formatCoord(centerLng)}</p>
      </div>
    `);

    // ✅ Inner static circle
    const innerCircle = L.circle([centerLat, centerLng], {
      radius: 12,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.3,
      weight: 1,
      opacity: 0.3,
    });
    innerCircle.addTo(map);
    innerCircleRef.current = innerCircle;

    setMarkerCreated(true);

    // Cleanup animation
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [center, isClient, L]);

  // ✅ Create marker when map is ready
  useEffect(() => {
    if (isClient && L && mapRef.current && center) {
      // Small delay to ensure map is fully loaded
      const timer = setTimeout(() => {
        createMarker();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [center, isClient, L, createMarker]);

  // ✅ Also create marker when map container changes
  useEffect(() => {
    if (isClient && L && mapRef.current && center) {
      createMarker();
    }
  }, [mapKey, center, isClient, L, createMarker]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.remove();
          markerRef.current = null;
        } catch (e) {}
      }
      if (circleRef.current) {
        try {
          circleRef.current.remove();
          circleRef.current = null;
        } catch (e) {}
      }
      if (innerCircleRef.current) {
        try {
          innerCircleRef.current.remove();
          innerCircleRef.current = null;
        } catch (e) {}
      }
    };
  }, []);

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

  const handleHotspotSelect = useCallback((hotspotData) => {
    if (onHotspotSelect) {
      onHotspotSelect(hotspotData);
    }
    if (onLocationSelect) {
      onLocationSelect(hotspotData);
    }
  }, [onHotspotSelect, onLocationSelect]);

  // ✅ Zoom controls
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      try {
        mapRef.current.setZoom(mapRef.current.getZoom() + 1);
      } catch (e) {}
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      try {
        mapRef.current.setZoom(mapRef.current.getZoom() - 1);
      } catch (e) {}
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      try {
        const centerLat = getCenterLat(center);
        const centerLng = getCenterLng(center);
        mapRef.current.setView([centerLat, centerLng], 12);
      } catch (e) {}
    }
  }, [center]);

  const handleCenterLocation = useCallback(() => {
    if (mapRef.current) {
      try {
        const centerLat = getCenterLat(center);
        const centerLng = getCenterLng(center);
        mapRef.current.setView([centerLat, centerLng], 15);
      } catch (e) {}
    }
  }, [center]);

  const handleRefresh = useCallback(() => {
    if (onLocationSelect && center) {
      const centerLat = getCenterLat(center);
      const centerLng = getCenterLng(center);
      onLocationSelect({
        latitude: centerLat,
        longitude: centerLng,
      });
    }
  }, [center, onLocationSelect]);

  if (!isClient) {
    return <MapLoading message="Loading map..." subMessage="Initializing map component" className={className} />;
  }

  if (isLoading) {
    return <MapLoading message="Loading heatmap data..." subMessage="Fetching temperature data from FortyGuard" className={className} />;
  }

  const centerLat = getCenterLat(center);
  const centerLng = getCenterLng(center);
  const hasGeoJSON = geojsonData && geojsonData.features && geojsonData.features.length > 0;

  return (
    <div className={`relative h-[400px] w-full rounded-lg overflow-hidden ${className}`}>
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
        {hasGeoJSON ? (
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
        {hotspots.length > 0 && hotspots.map((feature, index) => (
          <HotspotMarker 
            key={index}
            feature={feature}
            onSelect={handleHotspotSelect}
            size="medium"
          />
        ))}
      </MapContainer>
      
      {/* Legend */}
      {showLegend && (
        <MapLegend 
          minTemp={stats.min}
          maxTemp={stats.max}
          hotspots={stats.hotspots || hotspots.length}
          position="bottom-left"
        />
      )}
      
      {/* Map Controls */}
      {showControls && (
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
          onCenterLocation={handleCenterLocation}
          onToggleLayer={() => {}}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      )}
      
      {/* Data Info */}
      {hasGeoJSON && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 z-10">
          <span className="text-xs text-slate-500">
            {geojsonData.features.length} points • {stats.count || geojsonData.features.length} readings
          </span>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// ✅ Dynamic import for Marker and Popup to avoid SSR issues
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function HotspotMarker({ 
  feature, 
  onSelect,
  size = 'medium',
}) {
  const [L, setL] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet);
    });
  }, []);

  // Don't render on server
  if (!isMounted || !L) return null;

  const temp = feature.properties?.temperature || 0;
  const isHotspot = temp >= 35;
  
  if (!isHotspot) return null;

  const color = temp >= 40 ? '#ef4444' : '#f97316';
  const sizes = {
    small: { size: 16, fontSize: 7 },
    medium: { size: 22, fontSize: 9 },
    large: { size: 30, fontSize: 11 },
  };
  
  const selectedSize = sizes[size] || sizes.medium;
  const finalSize = Math.min(selectedSize.size, 12 + (temp - 35) * 1.5);

  const icon = L.divIcon({
    className: 'hotspot-marker',
    html: `
      <div style="
        width: ${finalSize}px;
        height: ${finalSize}px;
        background-color: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${selectedSize.fontSize}px;
        font-weight: bold;
        color: white;
        animation: pulse 2s infinite;
        cursor: pointer;
      ">
        ${Math.round(temp)}°
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    iconSize: [finalSize, finalSize],
    iconAnchor: [finalSize/2, finalSize/2],
  });

  // ✅ Safely get coordinates
  const coords = feature.geometry?.coordinates || [];
  const lat = coords.length > 1 ? coords[1] : 0;
  const lng = coords.length > 0 ? coords[0] : 0;

  const handleClick = () => {
    if (onSelect) {
      onSelect({
        latitude: lat,
        longitude: lng,
        temperature: temp,
        ...feature.properties,
      });
    }
  };

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Popup>
        <div className="p-2 min-w-[160px]">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">🔥</span>
            <p className="font-bold text-red-600">Hotspot Detected</p>
          </div>
          <p className="text-sm">
            Temperature: <span className="font-bold text-red-600">{temp}°C</span>
          </p>
          {feature.properties.riskScore && (
            <p className="text-sm">
              Risk Score: {feature.properties.riskScore}/100
            </p>
          )}
          <p className="text-xs text-slate-500 mt-2 italic">Click for analysis</p>
        </div>
      </Popup>
    </Marker>
  );
}
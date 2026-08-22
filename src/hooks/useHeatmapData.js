'use client';

import { useState, useEffect, useCallback } from 'react';
import { isUSLocation } from '@/lib/geo/coordinates';
import { calculateHeatmapStats } from '@/lib/geo/heatmap-utils';

export function useHeatmapData(initialLocation = null) {
  const [location, setLocation] = useState(initialLocation);
  const [data, setData] = useState(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({ min: null, max: null, mean: null, count: 0, hotspots: 0 });
  const [hotspots, setHotspots] = useState([]);

  // Fetch heatmap data
  const fetchHeatmapData = useCallback(async (selectedLocation) => {
    if (!selectedLocation) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Validate location
      if (!isUSLocation(selectedLocation.latitude, selectedLocation.longitude)) {
        throw new Error('Location must be within the United States');
      }

      const dateTime = new Date().toISOString().split('T')[0];
      const lat = selectedLocation.latitude;
      const lng = selectedLocation.longitude;
      const offset = 0.005;

      const polygon = [
        [lng - offset, lat - offset],
        [lng + offset, lat - offset],
        [lng + offset, lat + offset],
        [lng - offset, lat + offset],
        [lng - offset, lat - offset],
      ];

      const response = await fetch('/api/fortyguard/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon: polygon,
          dateTime: dateTime,
          granularity: '100m',
          analyticType: 'tcm',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }

      const result = await response.json();
      const heatmapData = result.data;

      // Extract GeoJSON
      const geoJSON = heatmapData?.geojson || null;
      setGeojsonData(geoJSON);

      // Calculate statistics using heatmap-utils
      const stats = calculateHeatmapStats(geoJSON);
      setStatistics(stats);

      // Detect hotspots
      if (geoJSON && geoJSON.features) {
        const hotFeatures = geoJSON.features
          .filter(f => f.properties?.temperature && f.properties.temperature >= 35);
        setHotspots(hotFeatures);
      }

      setData(heatmapData);
      setLocation(selectedLocation);

    } catch (err) {
      setError(err.message);
      console.error('Heatmap data error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate demo data
  const loadDemoData = useCallback((centerLat, centerLng) => {
    setIsLoading(true);
    setError(null);

    const features = [];
    const numPoints = 50;
    
    for (let i = 0; i < numPoints; i++) {
      const lat = centerLat + (Math.random() - 0.5) * 0.05;
      const lng = centerLng + (Math.random() - 0.5) * 0.05;
      const temp = 30 + Math.random() * 10;
      
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          temperature: Math.round(temp * 10) / 10,
          riskScore: Math.round(50 + Math.random() * 40),
        },
      });
    }

    const geoJSON = {
      type: 'FeatureCollection',
      features: features,
    };

    setGeojsonData(geoJSON);
    
    // Calculate statistics using heatmap-utils
    const stats = calculateHeatmapStats(geoJSON);
    setStatistics(stats);

    const hotFeatures = features.filter(f => f.properties.temperature >= 35);
    setHotspots(hotFeatures);
    
    setIsLoading(false);
  }, []);

  // Reset data
  const resetData = useCallback(() => {
    setData(null);
    setGeojsonData(null);
    setStatistics({ min: null, max: null, mean: null, count: 0, hotspots: 0 });
    setHotspots([]);
    setError(null);
  }, []);

  return {
    location,
    data,
    geojsonData,
    isLoading,
    error,
    statistics,
    hotspots,
    fetchHeatmapData,
    loadDemoData,
    resetData,
    setLocation,
  };
}
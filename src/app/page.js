"use client";

import React, { useState, useEffect } from "react";
import {
  Thermometer,
  Clock,
  TrendingUp,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Droplets,
  Wind,
  Shield,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Toaster, toast } from "sonner";

// Import UI components
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Import components
import RiskLevelBadge from "@/components/risk/RiskLevelBadge";
import RiskScore from "@/components/risk/RiskScore";
import TemperatureChart from "@/components/charts/TemperatureChart";
import TrendChart from "@/components/charts/TrendChart";
import AIExplanation from "@/components/ai/AIExplanation";
import Recommendations from "@/components/ai/Recommendations";
import LocationSearch from "@/components/map/LocationSearch";
import HeatMap from "@/components/map/HeatMap";
import ActivityProgress from "@/components/shared/ActivityProgress";

// ✅ NEW: Vulnerability Profile import
import VulnerabilityProfile from "@/components/risk/VulnerabilityProfile";

// Import utilities
import { formatTime } from "@/lib/utils";
import { DEFAULT_LOCATION } from "@/lib/constants";
import { isUSLocation } from "@/lib/geo/coordinates";

// ✅ NEW: Vulnerability utilities import
import { identifyAffectedGroups, getVulnerabilitySummary } from "@/lib/risk/vulnerability";

// Import timezone utilities
import {
  formatTimeWithTimezone,
  getCurrentTimeInCity,
  getTimezoneAbbreviation,
  formatDateWithTimezone,
} from "@/lib/datetime";

// Import forecast utilities
import { generateForecast, calculateTrend } from "@/lib/forecast/trend.js";

// Generate fallback demo data (only for error cases)
const generateFallbackData = () => {
  const baseTemp = 32 + Math.random() * 8;
  const riskScore = Math.round(50 + Math.random() * 40);
  const riskLevel =
    riskScore >= 80
      ? "CRITICAL"
      : riskScore >= 60
        ? "HIGH"
        : riskScore >= 40
          ? "MEDIUM"
          : "LOW";

  return {
    temperature: Math.round(baseTemp * 10) / 10,
    riskScore,
    riskLevel,
    exceedanceHours: Math.floor(Math.random() * 6) + 2,
    persistenceHours: Math.floor(Math.random() * 4) + 1,
    trend: { direction: Math.random() > 0.5 ? "rising" : "stable" },
    factors: [
      `Temperature is at ${riskLevel.toLowerCase()} risk levels (${Math.round(baseTemp)}°C)`,
      `Prolonged heat exposure (${Math.floor(Math.random() * 6) + 2} hours)`,
      "Temperature trend is increasing",
      "High humidity exacerbating heat stress",
    ],
    environmental: {
      heatIndex: Math.round((42 + Math.random() * 4) * 10) / 10,
      humidity: Math.round(55 + Math.random() * 25),
      airQuality: Math.round(50 + Math.random() * 50),
    },
  };
};

// Generate historical data
const generateHistoricalData = (baseTemp) => {
  const data = [];
  for (let i = 24; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    const temp = baseTemp - 5 + Math.sin(i / 6) * 5 + Math.random() * 2;
    data.push({
      time: date.toISOString(),
      temperature: Math.round(temp * 10) / 10,
    });
  }
  return data;
};

// Generate demo GeoJSON data for the map (only for error cases)
const generateDemoGeoJSON = (centerLat, centerLng) => {
  const features = [];
  const numPoints = 50;

  for (let i = 0; i < numPoints; i++) {
    const lat = centerLat + (Math.random() - 0.5) * 0.05;
    const lng = centerLng + (Math.random() - 0.5) * 0.05;
    const temp = 30 + Math.random() * 10;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
      properties: {
        temperature: Math.round(temp * 10) / 10,
        riskScore: Math.round(50 + Math.random() * 40),
      },
    });
  }

  return {
    type: "FeatureCollection",
    features: features,
  };
};

// KPI Card Component
const KPICard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLoading,
  color = "blue",
}) => {
  const trendColor =
    trend === "up"
      ? "text-red-500"
      : trend === "down"
        ? "text-green-500"
        : "text-slate-400";
  const colorClasses = {
    red: "bg-red-50 border-red-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    purple: "bg-purple-50 border-purple-200",
  };

  return (
    <Card className={`border ${colorClasses[color] || colorClasses.blue}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {title}
            </p>
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            )}
            {subtitle && !isLoading && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {icon && !isLoading && <div className="text-slate-400">{icon}</div>}
        </div>
        {trend && !isLoading && (
          <div className="mt-2 flex items-center space-x-1">
            <span className={`text-xs font-medium ${trendColor}`}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
            <span className={`text-xs ${trendColor}`}>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Environmental Factor Card
const EnvironmentalCard = ({ data }) => {
  if (!data) return null;

  const factors = [
    {
      label: "Heat Index",
      value: data.heatIndex,
      unit: "°C",
      icon: Thermometer,
    },
    { label: "Humidity", value: data.humidity, unit: "%", icon: Droplets },
    { label: "Air Quality", value: data.airQuality, unit: "", icon: Wind },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Shield className="h-4 w-4 mr-2 text-blue-500" />
          Environmental Factors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {factors.map((factor, index) => {
            const Icon = factor.icon;
            return (
              <div
                key={index}
                className="text-center p-2 bg-slate-50 rounded-lg"
              >
                <Icon className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                <p className="text-xs text-slate-500">{factor.label}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {factor.value || "--"}
                  {factor.unit}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [location, setLocation] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [temperatureData, setTemperatureData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activityStatus, setActivityStatus] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [geojsonData, setGeojsonData] = useState(null);
  const [vulnerabilityData, setVulnerabilityData] = useState(null);

  // Load initial demo data - NO location selected
  useEffect(() => {
    setLastUpdated(formatTimeWithTimezone(new Date()));
  }, []);

  // Handle location selection - ONLY set location, don't analyze
  const handleLocationSelect = (selectedLocation) => {
    console.log("[Page] Location selected:", selectedLocation);

    if (
      !selectedLocation ||
      !selectedLocation.latitude ||
      !selectedLocation.longitude
    ) {
      console.warn("[Page] Invalid location selected");
      return;
    }

    setLocation(selectedLocation);
    setError(null);
    setLastUpdated(formatTimeWithTimezone(new Date(), selectedLocation.name));
  };

  // Analyze location - Called when user clicks "Refresh Analysis"
  const handleAnalyze = () => {
    if (!location) {
      toast.warning("Please select a city first!");
      return;
    }
    analyzeLocation(location);
  };

  // Generate AI analysis
  const generateAIAnalysis = async (data, selectedLocation) => {
    console.log(
      "[AI] Starting AI analysis generation for:",
      selectedLocation?.name,
    );

    setIsAiLoading(true);
    setAiAnalysis(null);

    try {
      const requestData = {
        temperature: data.temperature,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        factors: data.factors || [],
        exceedanceHours: data.exceedanceHours || 0,
        persistenceHours: data.persistenceHours || 0,
        trend: data.trend || { direction: "stable" },
        environmental: data.environmental || null,
        location: {
          name: selectedLocation?.name || "Selected Location",
          latitude: selectedLocation?.latitude || 0,
          longitude: selectedLocation?.longitude || 0,
        },
      };

      console.log(
        "[AI] Sending request with location:",
        requestData.location.name,
      );

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[AI] API error:", errorText);
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();

      if (result.analysis) {
        console.log("[AI] ✅ Setting analysis for:", selectedLocation?.name);
        setAiAnalysis({
          analysis: result.analysis.analysis || result.analysis,
          structured: result.analysis.structured || {},
          metadata: result.analysis.metadata || {
            source: "groq",
            timestamp: new Date().toISOString(),
          },
        });
        toast.success("AI analysis generated!");
      } else {
        console.warn("[AI] No analysis in response");
        throw new Error("No analysis in response");
      }
    } catch (error) {
      console.error("[AI] Analysis error:", error);

      const fallbackAnalysis = {
        structured: {
          explanation: `AI analysis is currently unavailable. Based on the data, ${selectedLocation?.name || "this location"} is experiencing ${data.riskLevel?.toLowerCase() || "moderate"} heat conditions with temperatures reaching ${data.temperature}°C. ${data.factors?.length > 0 ? `Key factors include: ${data.factors.slice(0, 3).join(", ")}.` : ""}`,
          affected:
            "Outdoor workers, older adults, children, and individuals with prolonged outdoor exposure may be at elevated risk.",
          recommendations:
            data.riskLevel === "CRITICAL"
              ? "Avoid all non-essential outdoor activities. Seek immediate cooling if outdoors. Stay in air-conditioned spaces. Drink water frequently. Watch for signs of heat stroke."
              : data.riskLevel === "HIGH"
                ? "Avoid outdoor activities during peak heat. Stay in air-conditioned spaces when possible. Drink water every 15-20 minutes if outdoors. Monitor for signs of heat exhaustion."
                : data.riskLevel === "MEDIUM"
                  ? "Limit outdoor activities during peak hours (12-4 PM). Increase water intake. Seek shade when outdoors. Check on vulnerable individuals."
                  : "Continue monitoring temperature conditions. Stay hydrated if outdoors. Check forecast for potential changes.",
        },
        metadata: {
          source: "fallback",
          timestamp: new Date().toISOString(),
        },
      };
      setAiAnalysis(fallbackAnalysis);
      toast.warning("Using fallback AI analysis");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Analyze location with actual API
  const analyzeLocation = async (selectedLocation) => {
    if (!selectedLocation) {
      toast.warning("Please select a city first!");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAiAnalysis(null);
    setVulnerabilityData(null);
    setGeojsonData(null);
    setForecastData([]);
    setTrendAnalysis(null);
    setShowProgress(true);
    setActivityStatus({
      status: "submitted",
      progress: 5,
      message: "Initializing analysis...",
    });

    try {
      if (
        !isUSLocation(selectedLocation.latitude, selectedLocation.longitude)
      ) {
        throw new Error("Location must be within the United States");
      }

      setActivityStatus({
        status: "submitted",
        progress: 10,
        message: "Submitting heat analysis request...",
      });

      const dateTime = new Date().toISOString().split("T")[0];
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

      setActivityStatus({
        status: "processing",
        progress: 30,
        message: "Processing temperature data...",
      });

      let temperature = 35;
      let heatmapGeoJSON = null;

      try {
        const heatmapResponse = await fetch("/api/fortyguard/heatmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            polygon: polygon,
            dateTime: dateTime,
            granularity: "100m",
            analyticType: "tcm",
          }),
        });

        if (heatmapResponse.ok) {
          const response = await heatmapResponse.json();
          const heatmapData = response.data;

          heatmapGeoJSON = heatmapData?.geojson || null;

          if (heatmapData?.statistics?.mean) {
            temperature = heatmapData.statistics.mean;
          } else if (heatmapData?.geojson?.features) {
            const temps = heatmapData.geojson.features
              .map((f) => f.properties?.temperature)
              .filter((t) => t !== undefined && t !== null);
            if (temps.length > 0) {
              temperature = temps.reduce((a, b) => a + b, 0) / temps.length;
            }
          }
        } else {
          console.warn(
            "Heatmap API failed with status:",
            heatmapResponse.status,
          );
        }
      } catch (heatmapError) {
        console.warn("Heatmap API error:", heatmapError);
      }

      if (
        heatmapGeoJSON &&
        heatmapGeoJSON.features &&
        heatmapGeoJSON.features.length > 0
      ) {
        setGeojsonData(heatmapGeoJSON);
      } else {
        console.warn("No heatmap data received, using fallback");
        const fallbackGeoJSON = generateDemoGeoJSON(lat, lng);
        setGeojsonData(fallbackGeoJSON);
        toast.warning("Using estimated heatmap data");
      }

      setActivityStatus({
        status: "processing",
        progress: 50,
        message: "Processing environmental data...",
      });

      let environmentalData = null;
      try {
        const envResponse = await fetch("/api/fortyguard/environmental", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            dateTime: dateTime,
          }),
        });

        if (envResponse.ok) {
          const envData = await envResponse.json();
          environmentalData = envData.data;
        }
      } catch (envError) {
        console.warn("Environmental API error:", envError);
      }

      setActivityStatus({
        status: "processing",
        progress: 70,
        message: "Calculating heat risk...",
      });

      const exceedanceHours = Math.floor(Math.random() * 6) + 2;
      const persistenceHours = Math.floor(Math.random() * 4) + 1;

      const riskRequest = {
        temperature: Math.round(temperature * 10) / 10,
        exceedanceHours: exceedanceHours,
        persistenceHours: persistenceHours,
        trend: { direction: "rising" },
        environmental: environmentalData || {
          heatIndex: temperature + 3,
          humidity: 55,
          airQuality: 60,
        },
      };

      let riskResult;
      try {
        const riskResponse = await fetch("/api/risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(riskRequest),
        });

        if (riskResponse.ok) {
          riskResult = await riskResponse.json();
        } else {
          throw new Error("Risk API failed");
        }
      } catch (riskError) {
        console.warn("Risk API error, using fallback:", riskError);
        const score =
          temperature >= 40
            ? 85
            : temperature >= 35
              ? 70
              : temperature >= 30
                ? 50
                : 30;
        const level =
          score >= 80
            ? "CRITICAL"
            : score >= 60
              ? "HIGH"
              : score >= 40
                ? "MEDIUM"
                : "LOW";
        riskResult = {
          risk: {
            score: score,
            level: level,
            factors: [
              `Temperature is at ${level.toLowerCase()} levels (${temperature}°C)`,
              `Prolonged heat exposure (${exceedanceHours} hours)`,
              "Temperature trend is increasing",
            ],
          },
        };
      }

      setActivityStatus({
        status: "processing",
        progress: 85,
        message: "Generating insights...",
      });

      const newRiskData = {
        temperature: riskRequest.temperature,
        riskScore: riskResult.risk.score,
        riskLevel: riskResult.risk.level,
        exceedanceHours: exceedanceHours,
        persistenceHours: persistenceHours,
        trend: { direction: "rising" },
        factors: riskResult.risk.factors || [],
        environmental: environmentalData || {
          heatIndex: temperature + 3,
          humidity: 55,
          airQuality: 60,
        },
      };

      setRiskData(newRiskData);
      setTemperatureData({
        current: temperature,
        min: temperature - 5,
        max: temperature + 5,
        mean: temperature,
      });

      const history = generateHistoricalData(temperature);
      setHistoricalData(history);
      setForecastData(generateForecast(history, 12));
      setTrendAnalysis(calculateTrend(history));

      setLastUpdated(formatTimeWithTimezone(new Date(), selectedLocation.name));
      setActivityStatus({
        status: "completed",
        progress: 95,
        message: "Analysis complete!",
      });

      // Calculate vulnerability profile
      const affectedGroups = identifyAffectedGroups(
        riskResult.risk.level,
        riskRequest.temperature,
        environmentalData
      );
      const summary = getVulnerabilitySummary(
        riskResult.risk.level,
        riskRequest.temperature,
        affectedGroups
      );
      setVulnerabilityData({ affectedGroups, summary });
      console.log("[Vulnerability] Affected groups:", affectedGroups);

      // Generate AI analysis
      await generateAIAnalysis(
        {
          temperature: riskRequest.temperature,
          riskScore: riskResult.risk.score,
          riskLevel: riskResult.risk.level,
          factors: riskResult.risk.factors || [],
          exceedanceHours: exceedanceHours,
          persistenceHours: persistenceHours,
          trend: { direction: "rising" },
          environmental: environmentalData,
          affectedGroups: affectedGroups,
        },
        selectedLocation,
      );

      setActivityStatus({
        status: "completed",
        progress: 100,
        message: "All done!",
      });
      toast.success(`Analysis complete for ${selectedLocation.name}!`);
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error.message);
      setActivityStatus({
        status: "failed",
        progress: 0,
        message: "Analysis failed",
        error: error.message,
      });
      toast.error(error.message || "Failed to analyze location");

      const fallbackData = generateFallbackData();
      setRiskData(fallbackData);
      setTemperatureData({
        current: fallbackData.temperature,
        min: fallbackData.temperature - 6,
        max: fallbackData.temperature + 4,
        mean: fallbackData.temperature,
      });
      const history = generateHistoricalData(fallbackData.temperature);
      setHistoricalData(history);
      setForecastData(generateForecast(history, 12));
      setTrendAnalysis(calculateTrend(history));
      const fallbackGeoJSON = generateDemoGeoJSON(
        selectedLocation.latitude,
        selectedLocation.longitude,
      );
      setGeojsonData(fallbackGeoJSON);
      setLastUpdated(formatTimeWithTimezone(new Date(), selectedLocation.name));
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setShowProgress(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
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
                <p className="text-xs text-slate-500">
                  Hyperlocal Heat Intelligence
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">
                {location?.name || "Select a City"}
              </span>
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">
              🕐 {lastUpdated}{" "}
              {location?.name && getTimezoneAbbreviation(location.name)}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Controls */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
          {/* Row 1: Search Box + Search Icon + Location Icon */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                defaultLocation={location?.name || ""}
                onError={(msg) => setError(msg)}
                className="w-full"
              />
            </div>
          </div>

          {/* Row 2: Quick Select Cities */}
          <div className="mt-3 text-center">
            <div className="flex flex-wrap gap-1.5 text-center justify-center ">
              {[
                "Phoenix, AZ",
                "New York, NY",
                "Los Angeles, CA",
                "Chicago, IL",
                "Miami, FL",
                "Las Vegas, NV",
                "Houston, TX",
                "Atlanta, GA",
                "Denver, CO",
                "Seattle, WA",
                "San Francisco, CA",
                "Boston, MA",
                "Washington, DC",
                "Dallas, TX",
                "Austin, TX",
                "Orlando, FL",
                "Portland, OR",
                "Nashville, TN",
                "New Orleans, LA",
                "Charlotte, NC",
                "San Diego, CA",
                "San Antonio, TX",
                "Philadelphia, PA",
                "Detroit, MI",
                "Indianapolis, IN",
                "Jacksonville, FL",
                "Columbus, OH",
                "Memphis, TN",
                "Oklahoma City, OK",
                "Louisville, KY",
                "Baltimore, MD",
                "Milwaukee, WI",
                "Albuquerque, NM",
                "Tucson, AZ",
                "Fresno, CA",
                "Sacramento, CA",
                "Kansas City, MO",
                "Cleveland, OH",
                "Minneapolis, MN",
              ].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    const parts = city.split(", ");
                    const cityName = parts[0];
                    const coords = {
                      Phoenix: { lat: 33.4484, lng: -112.074 },
                      "New York": { lat: 40.7128, lng: -74.006 },
                      "Los Angeles": { lat: 34.0522, lng: -118.2437 },
                      Chicago: { lat: 41.8781, lng: -87.6298 },
                      Miami: { lat: 25.7617, lng: -80.1918 },
                      "Las Vegas": { lat: 36.1699, lng: -115.1398 },
                      Houston: { lat: 29.7604, lng: -95.3698 },
                      Atlanta: { lat: 33.749, lng: -84.388 },
                      Denver: { lat: 39.7392, lng: -104.9903 },
                      Seattle: { lat: 47.6062, lng: -122.3321 },
                      "San Francisco": { lat: 37.7749, lng: -122.4194 },
                      Boston: { lat: 42.3601, lng: -71.0589 },
                      Washington: { lat: 38.9072, lng: -77.0369 },
                      Dallas: { lat: 32.7767, lng: -96.797 },
                      Austin: { lat: 30.2672, lng: -97.7431 },
                      Orlando: { lat: 28.5383, lng: -81.3792 },
                      Portland: { lat: 45.5152, lng: -122.6784 },
                      Nashville: { lat: 36.1627, lng: -86.7816 },
                      "New Orleans": { lat: 29.9511, lng: -90.0715 },
                      Charlotte: { lat: 35.2271, lng: -80.8431 },
                      "San Diego": { lat: 32.7157, lng: -117.1611 },
                      "San Antonio": { lat: 29.4241, lng: -98.4936 },
                      Philadelphia: { lat: 39.9526, lng: -75.1652 },
                      Detroit: { lat: 42.3314, lng: -83.0458 },
                      Indianapolis: { lat: 39.7684, lng: -86.1581 },
                      Jacksonville: { lat: 30.3322, lng: -81.6557 },
                      Columbus: { lat: 39.9612, lng: -82.9988 },
                      Memphis: { lat: 35.1495, lng: -90.049 },
                      "Oklahoma City": { lat: 35.4676, lng: -97.5164 },
                      Louisville: { lat: 38.2527, lng: -85.7585 },
                      Baltimore: { lat: 39.2904, lng: -76.6122 },
                      Milwaukee: { lat: 43.0389, lng: -87.9065 },
                      Albuquerque: { lat: 35.0853, lng: -106.6056 },
                      Tucson: { lat: 32.2226, lng: -110.9747 },
                      Fresno: { lat: 36.7378, lng: -119.7871 },
                      Sacramento: { lat: 38.5816, lng: -121.4944 },
                      "Kansas City": { lat: 39.0997, lng: -94.5786 },
                      Cleveland: { lat: 41.4993, lng: -81.6944 },
                      Minneapolis: { lat: 44.9778, lng: -93.265 },
                    };
                    const coord = coords[cityName];
                    if (coord) {
                      handleLocationSelect({
                        name: city,
                        latitude: coord.lat,
                        longitude: coord.lng,
                      });
                    }
                  }}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    location?.name === city
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 border-slate-200"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Refresh Analysis Button */}
          <div className="mt-3 text-center">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !location}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/20 px-6 py-2.5 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {location ? "Refresh Analysis" : "Select a City First"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Activity Progress */}
        {showProgress && activityStatus && (
          <div className="mb-6">
            <ActivityProgress
              status={activityStatus.status}
              progress={activityStatus.progress}
              message={activityStatus.message}
              isComplete={activityStatus.status === "completed"}
              isError={activityStatus.status === "failed"}
              errorMessage={activityStatus.error}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* KPIs - Only show if data exists */}
        {riskData && temperatureData ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard
                title="Current Temperature"
                value={`${temperatureData?.current || "--"}°C`}
                subtitle={`Feels like ${riskData?.environmental?.heatIndex || "--"}°C`}
                icon={<Thermometer className="h-5 w-5" />}
                isLoading={isAnalyzing}
                color="red"
              />
              <KPICard
                title="Risk Level"
                value={
                  riskData ? (
                    <RiskLevelBadge level={riskData.riskLevel} />
                  ) : (
                    "--"
                  )
                }
                subtitle={`Score: ${riskData?.riskScore || "--"}/100`}
                icon={<AlertTriangle className="h-5 w-5" />}
                isLoading={isAnalyzing}
                color="yellow"
              />
              <KPICard
                title="Exceedance Hours"
                value={`${riskData?.exceedanceHours || 0}h`}
                subtitle="Above threshold"
                icon={<Clock className="h-5 w-5" />}
                isLoading={isAnalyzing}
                color="blue"
              />
              <KPICard
                title="Trend"
                value={riskData?.trend?.direction || "Unknown"}
                subtitle={
                  riskData?.trend?.direction === "rising"
                    ? "↑ Worsening"
                    : "→ Stable"
                }
                icon={<TrendingUp className="h-5 w-5" />}
                trend={
                  riskData?.trend?.direction === "rising" ? "up" : "stable"
                }
                isLoading={isAnalyzing}
                color="purple"
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                        Heat Map
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {location?.name || "No Location"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <HeatMap
                      center={
                        location
                          ? [location.latitude, location.longitude]
                          : [33.4484, -112.074]
                      }
                      geojsonData={geojsonData}
                      isLoading={isAnalyzing}
                      onLocationSelect={handleLocationSelect}
                      className="h-[400px]"
                    />
                  </CardContent>
                </Card>

                {/* Temperature Chart */}
                <TemperatureChart
                  historicalData={historicalData}
                  forecastData={forecastData}
                  title="Temperature History & Forecast"
                  height={280}
                  currentTemp={temperatureData?.current}
                  trend={trendAnalysis}
                  isLoading={isAnalyzing}
                  showForecast={true}
                  showControls={true}
                  cityName={location?.name}
                />

                {/* ✅ AI Analysis - Directly under Temperature Chart with no gap */}
                <div className="mt-2">
                  <AIExplanation
                    analysis={aiAnalysis}
                    isLoading={isAiLoading || isAnalyzing}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <RiskScore
                  score={riskData?.riskScore || 0}
                  level={riskData?.riskLevel || "LOW"}
                  factors={riskData?.factors || []}
                  isLoading={isAnalyzing}
                />

                <TrendChart
                  historicalData={historicalData}
                  forecastData={forecastData}
                  currentTemp={temperatureData?.current}
                  trend={trendAnalysis}
                  isLoading={isAnalyzing}
                />

                <VulnerabilityProfile
                  affectedGroups={vulnerabilityData?.affectedGroups || []}
                  summary={vulnerabilityData?.summary || null}
                  isLoading={isAnalyzing}
                />

                <EnvironmentalCard data={riskData?.environmental} />

                <Recommendations riskLevel={riskData?.riskLevel || "LOW"} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              No City Selected
            </h3>
            <p className="text-sm">
              Search for a city above and click "Refresh Analysis" to get
              started
            </p>
          </div>
        )}

        {/* ✅ Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-slate-700">
                HeatShield AI
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Built with ❤️ by</span>
              <span className="text-sm font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Ultimate
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Powered by</span>
              <a
                href="https://fortyguard.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-red-600 transition-colors font-medium"
              >
                FortyGuard
              </a>
              <span className="w-px h-3 bg-slate-300"></span>
              <a
                href="https://groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-red-600 transition-colors font-medium"
              >
                Groq
              </a>
            </div>
          </div>

          <div className="mt-3 text-center text-[10px] text-slate-400">
            Hyperlocal Heat Intelligence • Hackathon Project • FortyGuard
            Hackathon '26
          </div>
        </footer>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
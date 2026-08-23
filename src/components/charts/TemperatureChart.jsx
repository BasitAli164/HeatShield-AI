'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { getTemperatureColor, formatTemperature } from '@/lib/geo/heatmap-utils';
import { formatTimeWithTimezone, getCityTimezone } from '@/lib/datetime';

// Trend indicator component
const TrendIndicator = ({ direction, rate }) => {
  if (!direction) return null;
  
  const configs = {
    rising: { icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-50', label: 'Rising' },
    falling: { icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-50', label: 'Falling' },
    stable: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Stable' },
  };
  
  const config = configs[direction] || configs.stable;
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.bg} ${config.color} border-0`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
      {rate && ` (${rate}°/h)`}
    </Badge>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label, cityName }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  const isForecast = data.isForecast || false;
  
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 min-w-[150px]">
      <p className="text-xs text-slate-500 mb-1">
        {formatTimeWithTimezone(label, cityName)}
      </p>
      <p className="text-sm font-bold text-slate-900">
        {data.temperature}°C
      </p>
      {isForecast && (
        <div className="mt-1">
          <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-200">
            Forecast
          </Badge>
          {data.confidence && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              Confidence: {data.confidence}%
            </p>
          )}
        </div>
      )}
      {data.trend && (
        <p className="text-[10px] text-slate-500 mt-1">
          Trend: {data.trend}
        </p>
      )}
    </div>
  );
};

export default function TemperatureChart({ 
  historicalData = [],
  forecastData = [],
  title = 'Temperature Trend',
  height = 300,
  showForecast = true,
  showControls = true,
  isLoading = false,
  currentTemp = null,
  trend = null,
  onTimeRangeChange = null,
  cityName = null,
}) {
  const [timeRange, setTimeRange] = useState('24h');
  const [showConfidence, setShowConfidence] = useState(true);
  const [combinedData, setCombinedData] = useState([]);

  // Combine historical and forecast data
  useEffect(() => {
    let combined = [];
    
    if (historicalData && historicalData.length > 0) {
      const history = historicalData.map(d => ({
        ...d,
        isForecast: false,
        type: 'historical',
      }));
      combined = [...history];
    }
    
    if (showForecast && forecastData && forecastData.length > 0) {
      const forecast = forecastData.map(d => ({
        ...d,
        isForecast: true,
        type: 'forecast',
      }));
      
      if (combined.length > 0 && forecast.length > 0) {
        const lastHistorical = combined[combined.length - 1];
        const firstForecast = forecast[0];
        
        const lastTime = new Date(lastHistorical.time);
        const firstTime = new Date(firstForecast.time);
        const diffHours = (firstTime - lastTime) / (1000 * 60 * 60);
        
        if (diffHours > 1) {
          combined.push({
            time: lastHistorical.time,
            temperature: lastHistorical.temperature,
            isForecast: false,
            type: 'historical',
            isConnector: true,
          });
        }
      }
      
      combined = [...combined, ...forecast];
    }
    
    setCombinedData(combined);
  }, [historicalData, forecastData, showForecast]);

  // Filter data by time range
  const getFilteredData = () => {
    if (!combinedData || combinedData.length === 0) return [];
    
    const now = new Date();
    const rangeMap = {
      '6h': 6,
      '12h': 12,
      '24h': 24,
      '48h': 48,
    };
    
    const hours = rangeMap[timeRange] || 24;
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    return combinedData.filter(d => new Date(d.time) >= cutoff);
  };

  const filteredData = getFilteredData();

  // Calculate trend from data
  const getTrendFromData = () => {
    if (!filteredData || filteredData.length < 2) return null;
    
    const temps = filteredData.map(d => d.temperature);
    const first = temps[0];
    const last = temps[temps.length - 1];
    const diff = last - first;
    
    if (Math.abs(diff) < 0.5) return { direction: 'stable', rate: 0 };
    
    const hours = (new Date(filteredData[filteredData.length - 1].time) - new Date(filteredData[0].time)) / (1000 * 60 * 60);
    const rate = diff / (hours || 1);
    
    return {
      direction: diff > 0 ? 'rising' : 'falling',
      rate: Math.round(rate * 10) / 10,
    };
  };

  const calculatedTrend = trend || getTrendFromData();

  // Get min and max for y-axis
  const getYAxisDomain = () => {
    if (!filteredData || filteredData.length === 0) return [0, 50];
    
    const temps = filteredData.map(d => d.temperature);
    const min = Math.min(...temps) - 5;
    const max = Math.max(...temps) + 5;
    return [Math.max(0, Math.floor(min)), Math.ceil(max)];
  };

  // ✅ Format x-axis with timezone
  const formatXAxis = (time) => {
    return formatTimeWithTimezone(time, cityName);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-sm text-slate-500">Loading temperature data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-slate-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No temperature data available</p>
<p className="text-sm">Click &quot;Analyze Location&quot; to load data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {calculatedTrend && (
              <TrendIndicator 
                direction={calculatedTrend.direction} 
                rate={calculatedTrend.rate} 
              />
            )}
            {currentTemp && (
              <Badge variant="outline" className="text-xs">
                Current: {currentTemp}°C
              </Badge>
            )}
          </div>
          {showControls && (
            <div className="flex items-center space-x-1">
              {['6h', '12h', '24h', '48h'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  className={`h-7 px-2 text-xs ${
                    timeRange === range 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : ''
                  }`}
                  onClick={() => {
                    setTimeRange(range);
                    if (onTimeRangeChange) onTimeRangeChange(range);
                  }}
                >
                  {range}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: height }}>
          <ResponsiveContainer>
            <ComposedChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatXAxis}
                stroke="#94a3b8"
                fontSize={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#94a3b8"
                fontSize={10}
                domain={getYAxisDomain()}
                label={{ 
                  value: 'Temperature (°C)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: 10, fill: '#94a3b8' }
                }}
              />
              <Tooltip content={<CustomTooltip cityName={cityName} />} />
              
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls={true}
              />
              
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={true}
                  data={filteredData.filter(d => d.isForecast)}
                />
              )}
              
              {showForecast && showConfidence && forecastData && forecastData.length > 0 && (
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="transparent"
                  fill="#94a3b8"
                  fillOpacity={0.1}
                  data={filteredData.filter(d => d.isForecast)}
                />
              )}
              
              {currentTemp && (
                <ReferenceLine 
                  y={currentTemp} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                  label={{
                    value: `Current ${currentTemp}°C`,
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span>Historical</span>
          </div>
          {showForecast && forecastData && forecastData.length > 0 && (
            <>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-0.5 bg-slate-400 border-t-2 border-dashed border-slate-400"></div>
                <span>Forecast</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-2 bg-slate-400/20 border border-slate-300"></div>
                <span>Confidence</span>
              </div>
            </>
          )}
          {currentTemp && (
            <div className="flex items-center space-x-1">
              <div className="w-4 h-0.5 bg-red-500 border-t-2 border-dashed border-red-500"></div>
              <span>Current</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
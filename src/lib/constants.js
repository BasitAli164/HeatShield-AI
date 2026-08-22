/**
 * Application Constants
 */

export const APP_CONFIG = {
  name: 'HeatShield AI',
  version: '1.0.0',
  description: 'AI-powered hyperlocal urban heat-risk intelligence platform',
};

export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const RISK_COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const MAP_CONFIG = {
  defaultCenter: [39.8283, -98.5795],
  defaultZoom: 4,
  minZoom: 3,
  maxZoom: 18,
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileLayerAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const FORTYGUARD_CONFIG = {
  baseUrl: process.env.FORTYGUARD_BASE_URL || 'https://api.fortyguard.com',
  granularities: ['60m', '80m', '100m'],
  analyticTypes: ['tcm', 'time_of_measure', 'exceedance', 'persistence'],
  maxPollAttempts: 60,
  pollInterval: 2000,
  timeout: 120000,
};

export const DEFAULT_LOCATION = {
  name: 'Phoenix, AZ',
  latitude: 33.4484,
  longitude: -112.0740,
};

export const SUPPORTED_US_CITIES = [
  'Phoenix, AZ',
  'Las Vegas, NV',
  'Miami, FL',
  'Los Angeles, CA',
  'Houston, TX',
  'New York, NY',
  'Chicago, IL',
  'Dallas, TX',
];
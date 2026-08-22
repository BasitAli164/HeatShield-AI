import { z } from 'zod';

/**
 * FortyGuard API Response Validation Schemas
 */

// Heatmap request schema
export const heatmapRequestSchema = z.object({
  polygon_aoi: z.array(z.array(z.number())).min(4),
  date_time: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  granularity: z.enum(['60m', '80m', '100m']).default('100m'),
  analytic_type: z.enum(['tcm', 'time_of_measure', 'exceedance', 'persistence']).default('tcm'),
  threshold: z.number().optional(),
  direction: z.enum(['above', 'below']).optional(),
}).refine((data) => {
  if (['exceedance', 'persistence'].includes(data.analytic_type)) {
    return data.threshold !== undefined && data.threshold !== null && data.direction !== undefined;
  }
  return true;
}, {
  message: 'Threshold and direction are required for exceedance and persistence analytics',
});

// Heatmap response schema
export const heatmapResponseSchema = z.object({
  activity_id: z.string(),
  status: z.string().optional(),
  data: z.object({
    geojson: z.any().optional(),
    statistics: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      mean: z.number().optional(),
      count: z.number().optional(),
      total: z.number().optional(),
    }).optional(),
  }).optional(),
  message: z.string().optional(),
});

// Status response schema
export const statusResponseSchema = z.object({
  activity_id: z.string(),
  status: z.string(),
  message: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  data: z.any().optional(),
  result: z.any().optional(),
});

// Environmental params request schema
export const environmentalRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  date_time: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Environmental params response schema
export const environmentalResponseSchema = z.object({
  data: z.object({
    heat_index: z.number().optional(),
    apparent_temperature: z.number().optional(),
    wet_bulb_temperature: z.number().optional(),
    relative_humidity: z.number().min(0).max(100).optional(),
    aqi: z.number().optional(),
    solar_irradiance: z.number().optional(),
    timestamp: z.string().optional(),
  }).optional(),
  version: z.string().optional(),
});

// Risk calculation request schema
export const riskCalculationRequestSchema = z.object({
  temperature: z.number().min(-50).max(60),
  exceedanceHours: z.number().min(0).max(24).default(0),
  persistenceHours: z.number().min(0).max(24).default(0),
  trend: z.object({
    direction: z.enum(['rising', 'stable', 'falling']),
    rate: z.number().optional(),
  }).optional(),
  environmental: z.object({
    heatIndex: z.number().optional(),
    humidity: z.number().min(0).max(100).optional(),
    airQuality: z.number().min(0).max(500).optional(),
  }).optional(),
});
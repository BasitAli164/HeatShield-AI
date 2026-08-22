import { z } from 'zod';

// Location schema
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().optional(),
});

// Heatmap request schema
export const heatmapRequestSchema = z.object({
  polygon: z.array(z.array(z.number())).min(4),
  dateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  granularity: z.enum(['60m', '80m', '100m']).default('100m'),
  analyticType: z.enum(['tcm', 'time_of_measure', 'exceedance', 'persistence']).default('tcm'),
  threshold: z.number().optional(),
  direction: z.enum(['above', 'below']).optional(),
}).refine((data) => {
  // If analyticType is exceedance or persistence, threshold and direction are required
  if (['exceedance', 'persistence'].includes(data.analyticType)) {
    return data.threshold !== undefined && data.threshold !== null && data.direction !== undefined;
  }
  return true;
}, {
  message: 'Threshold and direction are required for exceedance and persistence analytics',
});

// Risk calculation schema
export const riskCalculationSchema = z.object({
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

// AI analysis schema
export const aiAnalysisSchema = z.object({
  location: locationSchema,
  temperature: z.number(),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  factors: z.array(z.string()),
  exceedanceHours: z.number().optional(),
  persistenceHours: z.number().optional(),
  trend: z.object({
    direction: z.enum(['rising', 'stable', 'falling']),
    rate: z.number().optional(),
  }).optional(),
  environmental: z.object({
    heatIndex: z.number().optional(),
    humidity: z.number().min(0).max(100).optional(),
  }).optional(),
});

// API response schemas
export const fortyGuardHeatmapResponseSchema = z.object({
  activity_id: z.string(),
  status: z.string().optional(),
  data: z.object({
    geojson: z.any().optional(),
    statistics: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      mean: z.number().optional(),
      count: z.number().optional(),
    }).optional(),
  }).optional(),
});

export const fortyGuardStatusResponseSchema = z.object({
  activity_id: z.string(),
  status: z.string(),
  message: z.string().optional(),
  data: z.any().optional(),
});
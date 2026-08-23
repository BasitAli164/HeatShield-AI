'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function KPI({ title, value, subtitle, icon, trend, className }) {
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-slate-400';

  return (
    <Card className={cn("border-slate-200", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>
        {trend && (
          <div className="mt-2 flex items-center space-x-1">
            <span className={cn("text-xs font-medium", trendColor)}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
            <span className={cn("text-xs", trendColor)}>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
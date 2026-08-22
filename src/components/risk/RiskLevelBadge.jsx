'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const RISK_LEVELS = {
  LOW: {
    label: 'LOW',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: '🟢',
  },
  MEDIUM: {
    label: 'MEDIUM',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: '🟡',
  },
  HIGH: {
    label: 'HIGH',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: '🟠',
  },
  CRITICAL: {
    label: 'CRITICAL',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: '🔴',
  },
};

export default function RiskLevelBadge({ level, className }) {
  const risk = RISK_LEVELS[level] || RISK_LEVELS.LOW;

  return (
    <Badge className={cn("font-medium", risk.className, className)}>
      <span className="mr-1">{risk.icon}</span>
      {risk.label}
    </Badge>
  );
}
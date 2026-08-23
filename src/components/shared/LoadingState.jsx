import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export function LoadingCard({ className }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-12 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}

export function LoadingMap() {
  return (
    <div className="h-[400px] w-full bg-slate-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="mb-4" />
        <p className="text-sm text-slate-500">Loading map data...</p>
      </div>
    </div>
  );
}

export function LoadingKPI() {
  return (
    <div className="p-4 border rounded-lg space-y-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}
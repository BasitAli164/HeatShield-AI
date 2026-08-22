'use client';

import React from 'react';
import Header from './Header';

export default function DashboardLayout({ 
  children, 
  location, 
  isDemo, 
  lastUpdated,
  onAnalyze,
  isLoading 
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header location={location} isDemo={isDemo} lastUpdated={lastUpdated} />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ActivityProgress({ 
  status, 
  progress = 0, 
  message = 'Processing...',
  isComplete = false,
  isError = false,
  errorMessage = '',
}) {
  if (isComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700">Analysis Complete</p>
              <p className="text-xs text-green-600">Data has been successfully processed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Analysis Failed</p>
              <p className="text-xs text-red-600">{errorMessage || 'An error occurred during processing'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusMessages = {
    'submitted': 'Submitting analysis request...',
    'queued': 'Request queued for processing...',
    'processing': 'Processing hyperlocal temperature data...',
    'polling': 'Waiting for results...',
    'completed': 'Analysis complete!',
    'failed': 'Analysis failed',
  };

  const progressValues = {
    'submitted': 10,
    'queued': 25,
    'processing': 50,
    'polling': 75,
    'completed': 100,
    'failed': 0,
  };

  const currentProgress = progress || progressValues[status] || 0;
  const currentMessage = message || statusMessages[status] || 'Processing...';

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-700">{currentMessage}</p>
              <p className="text-xs text-blue-600">This may take a few moments</p>
            </div>
          </div>
          <Progress 
            value={currentProgress} 
            className="h-1 bg-blue-100" 
            indicatorClassName="bg-blue-500"
          />
          <div className="flex justify-between text-[10px] text-blue-500">
            <span>Initializing</span>
            <span>{currentProgress}%</span>
            <span>Complete</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
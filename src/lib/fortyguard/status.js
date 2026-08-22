/**
 * FortyGuard Status API
 * Handles activity status polling with progress tracking
 */

import { fortyGuardClient } from './client.js';

const DEFAULT_POLL_INTERVAL = 2000; // 2 seconds
const DEFAULT_TIMEOUT = 120000; // 2 minutes
const DEFAULT_MAX_ATTEMPTS = 60;

/**
 * Poll activity status with progress tracking
 */
export async function pollActivityStatus(activityId, options = {}) {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    timeout = DEFAULT_TIMEOUT,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    onProgress = null,
    onStatusChange = null,
  } = options;

  const startTime = Date.now();
  let attempts = 0;
  let lastStatus = '';

  // Initial status
  if (onProgress) {
    onProgress({
      status: 'submitted',
      progress: 5,
      message: 'Analysis submitted...',
    });
  }

  while (true) {
    attempts++;
    const elapsed = Date.now() - startTime;

    // Check timeout
    if (elapsed > timeout) {
      throw new Error(`Activity ${activityId} timed out after ${timeout}ms`);
    }

    // Check max attempts
    if (attempts > maxAttempts) {
      throw new Error(`Activity ${activityId} exceeded maximum polling attempts (${maxAttempts})`);
    }

    try {
      // Get status from API
      const statusResponse = await fortyGuardClient.request(`/v1/status/${activityId}`);
      
      const currentStatus = statusResponse.status?.toLowerCase() || '';
      const statusMessage = statusResponse.message || '';
      const progress = statusResponse.progress || 0;

      // Notify status change
      if (onStatusChange && currentStatus !== lastStatus) {
        onStatusChange({
          status: currentStatus,
          previousStatus: lastStatus,
          message: statusMessage,
          progress: progress,
          data: statusResponse.data,
        });
        lastStatus = currentStatus;
      }

      // Notify progress
      if (onProgress) {
        const progressValue = progress || getProgressForStatus(currentStatus);
        onProgress({
          status: currentStatus,
          progress: progressValue,
          message: statusMessage || getStatusMessage(currentStatus),
          data: statusResponse.data,
          attempts: attempts,
          elapsed: elapsed,
        });
      }

      // Handle status
      switch (currentStatus) {
        case 'completed':
        case 'success':
          return {
            success: true,
            status: currentStatus,
            data: statusResponse.data || statusResponse.result,
            message: statusMessage,
            attempts: attempts,
            elapsed: elapsed,
          };
        case 'failed':
        case 'error':
          throw new Error(statusMessage || `Activity ${activityId} failed`);
        case 'processing':
        case 'pending':
        case 'queued':
          // Continue polling
          await sleep(pollInterval);
          continue;
        default:
          console.warn(`Unknown status: ${currentStatus}, continuing polling`);
          await sleep(pollInterval);
          continue;
      }
    } catch (error) {
      if (error.message.includes('timed out') || 
          error.message.includes('failed') || 
          error.message.includes('exceeded')) {
        throw error;
      }
      
      // Network errors - retry with exponential backoff
      const backoff = Math.min(pollInterval * Math.pow(1.5, attempts), 10000);
      console.warn(`Status poll attempt ${attempts} failed: ${error.message}, retrying in ${backoff}ms`);
      
      if (onProgress) {
        onProgress({
          status: 'retrying',
          progress: 30 + (attempts * 2),
          message: `Retrying... (attempt ${attempts})`,
          attempts: attempts,
          elapsed: elapsed,
        });
      }
      
      await sleep(backoff);
      continue;
    }
  }
}

/**
 * Get progress value based on status
 */
function getProgressForStatus(status) {
  const progressMap = {
    'submitted': 5,
    'queued': 25,
    'processing': 50,
    'polling': 75,
    'retrying': 30,
    'completed': 100,
    'success': 100,
    'failed': 0,
    'error': 0,
  };
  return progressMap[status] || 0;
}

/**
 * Get status message
 */
function getStatusMessage(status) {
  const messages = {
    'submitted': 'Analysis submitted...',
    'queued': 'Request queued for processing...',
    'processing': 'Processing hyperlocal temperature data...',
    'polling': 'Waiting for results...',
    'retrying': 'Retrying connection...',
    'completed': 'Analysis complete!',
    'success': 'Analysis complete!',
    'failed': 'Analysis failed',
    'error': 'Analysis failed',
  };
  return messages[status] || 'Processing...';
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a status is terminal
 */
export function isTerminalStatus(status) {
  const terminal = ['completed', 'success', 'failed', 'error'];
  return terminal.includes(status?.toLowerCase() || '');
}

/**
 * Check if a status is successful
 */
export function isSuccessStatus(status) {
  const success = ['completed', 'success'];
  return success.includes(status?.toLowerCase() || '');
}
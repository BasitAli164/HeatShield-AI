/**
 * API route for FortyGuard status polling
 * Integrated with: normalizer, errors, rate-limit
 */

import { pollActivityStatus } from '@/lib/fortyguard/status.js';
import { normalizeStatusResponse } from '@/lib/fortyguard/normalizer.js';
import { APIError, logError, getUserFriendlyError } from '@/lib/errors.js';
import { isRateLimited, getRateLimitHeaders } from '@/lib/rate-limit.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    if (isRateLimited(clientId, 100, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(clientId),
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    const pollInterval = parseInt(searchParams.get('pollInterval') || '2000');
    const timeout = parseInt(searchParams.get('timeout') || '120000');

    if (!activityId) {
      return NextResponse.json(
        { error: 'activityId is required' },
        { status: 400 }
      );
    }

    // Poll for status
    const status = await pollActivityStatus(activityId, {
      pollInterval,
      timeout,
      onProgress: (progress) => {
        // Progress is handled by the client
        console.log(`[Status] ${activityId}: ${progress.status} - ${progress.progress}%`);
      },
    });

    // Normalize response
    const normalized = normalizeStatusResponse(status);

    return NextResponse.json({
      success: true,
      status: normalized,
      metadata: {
        activityId,
        pollInterval,
        timeout,
        processedAt: new Date().toISOString(),
      },
    }, {
      headers: getRateLimitHeaders(clientId),
    });

  } catch (error) {
    logError(error, 'Status API');

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: getUserFriendlyError(error) },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { 
        error: getUserFriendlyError(error),
        status: 'failed',
      },
      { status: 500 }
    );
  }
}
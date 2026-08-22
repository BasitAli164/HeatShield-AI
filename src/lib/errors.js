/**
 * Application Error Handling Utilities
 */

// Custom error classes
export class APIError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class RateLimitError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class TimeoutError extends Error {
  constructor(message, timeout) {
    super(message);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

// Error type detection
export function isAPIError(error) {
  return error instanceof APIError || error?.name === 'APIError';
}

export function isValidationError(error) {
  return error instanceof ValidationError || error?.name === 'ValidationError';
}

export function isRateLimitError(error) {
  return error instanceof RateLimitError || error?.name === 'RateLimitError';
}

export function isTimeoutError(error) {
  return error instanceof TimeoutError || error?.name === 'TimeoutError';
}

// User-friendly error messages
export function getUserFriendlyError(error) {
  if (isRateLimitError(error)) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (isTimeoutError(error)) {
    return 'The request took too long. Please try again.';
  }
  
  if (isValidationError(error)) {
    return `Invalid data: ${error.message}`;
  }
  
  if (isAPIError(error)) {
    if (error.statusCode === 401) {
      return 'Authentication failed. Please check your API key.';
    }
    if (error.statusCode === 403) {
      return 'Access denied. Please check your API permissions.';
    }
    if (error.statusCode === 404) {
      return 'The requested data was not found.';
    }
    if (error.statusCode === 429) {
      return 'Rate limit exceeded. Please try again later.';
    }
    if (error.statusCode >= 500) {
      return 'The server is experiencing issues. Please try again later.';
    }
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}

// Safe error logging
export function logError(error, context = '') {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString(),
    ...error,
  };

  // Remove sensitive data
  delete errorInfo.headers;
  delete errorInfo.authorization;
  delete errorInfo.apiKey;

  console.error(`[Error] ${context}:`, errorInfo);

  // In production, you could send to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service
  }

  return errorInfo;
}
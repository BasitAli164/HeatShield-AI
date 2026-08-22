/**
 * FortyGuard API Client
 * Handles authentication and base API requests
 */

import { FORTYGUARD_CONFIG, validateConfig } from './config.js';

const FORTYGUARD_BASE_URL = FORTYGUARD_CONFIG.baseUrl;
const FORTYGUARD_API_KEY = FORTYGUARD_CONFIG.apiKey;

export class FortyGuardClient {
  constructor() {
    this.apiKey = FORTYGUARD_API_KEY;
    this.baseUrl = FORTYGUARD_BASE_URL;
    this.isConfigured = !!this.apiKey;
    
    if (!this.isConfigured) {
      console.warn('FortyGuard API key is not configured. Please set FORTYGUARD_API_KEY in .env.local');
    }
  }

  async request(endpoint, options = {}) {
    if (!this.isConfigured) {
      throw new Error('FortyGuard API is not configured. Please set FORTYGUARD_API_KEY in .env.local');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'api-key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseTime = Date.now() - startTime;
      console.log(`[FortyGuard] ${options.method || 'GET'} ${endpoint} - ${response.status} (${responseTime}ms)`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Request timed out after 30 seconds');
      }
      console.error(`[FortyGuard] Request failed: ${error.message}`);
      throw error;
    }
  }

  // Check if API is available
  async checkHealth() {
    try {
      // Try a simple request to check if API is responsive
      await this.request('/v1/status', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        isConfigured: this.isConfigured,
      };
    }
  }
}

export const fortyGuardClient = new FortyGuardClient();
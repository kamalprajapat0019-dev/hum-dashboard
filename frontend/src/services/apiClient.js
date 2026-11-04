import { appConfig } from '../config/appConfig';
import { buildApiUrl, resolveApiBaseUrl } from '../config/apiConfig';
import { storage } from '../utils/storage';

/**
 * In-flight request deduplication map (prevents identical concurrent network calls)
 */
const inFlightRequests = new Map();

/**
 * Short-lived in-memory response cache for idempotent GET requests
 */
const responseCache = new Map();

function getDefaultTtl(url) {
  if (url.includes('/admin/clients') || url.includes('/admin/config')) {
    return 60000; // 60s for stable reference datasets
  }
  if (url.includes('/admin/exam-types') || url.includes('/admin/exams')) {
    return 30000; // 30s for examination hierarchy definitions
  }
  if (url.includes('/admin/analytics')) {
    return 15000; // 15s for dashboard analytics (fast client switching)
  }
  if (url.includes('/admin/projects')) {
    return 15000; // 15s for project listings
  }
  if (url.includes('/admin/calendar')) {
    return 20000; // 20s for annual examination schedules
  }
  return 10000; // 10s default
}

/**
 * Enterprise HTTP Client with Request Deduplication, In-Memory Response Caching,
 * Safe Content-Type Validation, and Production-Grade Error Handling.
 */
class ApiClient {
  constructor(config = {}) {
    this.customBaseUrl = config.baseUrl;
    this.timeout = config.timeout || appConfig.api.timeout;
  }

  getBaseUrl() {
    return this.customBaseUrl ? this.customBaseUrl.replace(/\/+$/, '') : resolveApiBaseUrl();
  }

  /**
   * Constructs the absolute or normalized URL, preventing duplicate `/api/v1` prefixes
   * and cleanly formatting query parameters.
   */
  buildUrl(endpoint, params) {
    return buildApiUrl(endpoint, params, this.customBaseUrl);
  }

  /**
   * Invalidates cached responses matching an optional string or regex pattern.
   * If no pattern is provided, clears the entire cache.
   */
  clearCache(pattern = null) {
    if (!pattern) {
      responseCache.clear();
      return;
    }
    for (const key of responseCache.keys()) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        responseCache.delete(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        responseCache.delete(key);
      }
    }
  }

  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint, options.params);
    const method = (options.method || 'GET').toUpperCase();
    const token = storage.get(appConfig.auth.tokenStorageKey, 'session');

    // ── 1. Cache Lookup for GET requests ───────────────────────────────────
    const isGet = method === 'GET';
    const bypassCache = Boolean(options.bypassCache || options.noCache);
    const cacheKey = `${url}::${token || 'anon'}`;

    if (isGet && !bypassCache) {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        // Return structured clone to prevent caller mutation of cache
        return JSON.parse(JSON.stringify(cached.data));
      } else if (cached) {
        responseCache.delete(cacheKey);
      }

      // ── 2. In-Flight Request Deduplication ────────────────────────────────
      // If an identical request is already active, share its promise
      if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener('abort', () => controller.abort());
      }
    }

    const executeFetch = async () => {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timer);

        // Inspect Content-Type header before attempting JSON parsing
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.toLowerCase().includes('application/json');

        // Detect HTML response (e.g. Vercel SPA index.html fallback or reverse proxy error page)
        if (!isJson) {
          const rawText = await response.text();
          const isHtml = /^\s*<!doctype|^\s*<html/i.test(rawText);

          if (isHtml) {
            const isSpaFallback = response.ok;
            const errorMessage = isSpaFallback
              ? `API Configuration Error: Received HTML instead of JSON from "${url}". The frontend is requesting the static frontend host instead of the backend API. Please configure VITE_API_BASE_URL in Vercel to point to your backend.`
              : `HTTP Error ${response.status}: The server returned an HTML error page instead of JSON.`;

            const htmlError = new Error(errorMessage);
            htmlError.status = response.status;
            htmlError.isHtmlResponse = true;
            htmlError.isRoutingError = isSpaFallback;
            htmlError.endpoint = endpoint;
            htmlError.url = url;

            console.error(`[API Routing Error] ${method} ${url} [HTTP ${response.status}]:`, errorMessage);
            throw htmlError;
          }

          // Non-JSON, non-HTML response
          if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
          }

          try {
            return JSON.parse(rawText);
          } catch {
            return rawText;
          }
        }

        // Handle HTTP error statuses with valid JSON error bodies
        if (!response.ok) {
          let errorBody = {};
          try {
            errorBody = await response.json();
          } catch {
            errorBody = { message: `HTTP ${response.status}: ${response.statusText}` };
          }

          const message =
            errorBody.message ||
            errorBody.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`;

          const error = new Error(message);
          error.status = response.status;
          error.data = errorBody;
          error.endpoint = endpoint;
          error.url = url;

          if (response.status === 401) error.isAuthError = true;
          if (response.status === 403) error.isForbidden = true;
          if (response.status === 404) error.isNotFound = true;
          if (response.status >= 500) error.isServerError = true;

          console.error(`[API Error] ${method} ${url} [${response.status}]:`, message);
          throw error;
        }

        // Successful JSON response
        const data = await response.json();

        // Save to cache for GET requests
        if (isGet && !bypassCache && data?.success) {
          const ttl = typeof options.ttl === 'number' ? options.ttl : getDefaultTtl(url);
          responseCache.set(cacheKey, {
            data,
            expiresAt: Date.now() + ttl,
          });
        }

        return data;
      } catch (err) {
        clearTimeout(timer);

        if (err.name === 'AbortError') {
          const timeoutErr = new Error(`Request timeout or aborted after ${this.timeout}ms for endpoint: ${endpoint}`);
          timeoutErr.status = 408;
          timeoutErr.isTimeout = true;
          timeoutErr.endpoint = endpoint;
          timeoutErr.url = url;
          throw timeoutErr;
        }

        if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('NetworkError'))) {
          const netErr = new Error(`Network Connection Error: Failed to reach backend at ${this.getBaseUrl()}. Please check network connectivity.`);
          netErr.status = 0;
          netErr.isNetworkError = true;
          netErr.endpoint = endpoint;
          netErr.url = url;
          console.error(`[API Network Error] ${method} ${url}:`, netErr.message);
          throw netErr;
        }

        throw err;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    };

    if (isGet && !bypassCache) {
      const fetchPromise = executeFetch();
      inFlightRequests.set(cacheKey, fetchPromise);
      return fetchPromise;
    }

    return executeFetch();
  }

  get(endpoint, options = {}) {
    const isOptionsObject = options && (options.headers || options.params || options.signal || options.bypassCache || options.ttl);
    const headers = isOptionsObject ? options.headers : options;
    const reqOptions = isOptionsObject ? { ...options, method: 'GET' } : { method: 'GET', headers };
    return this.request(endpoint, reqOptions);
  }

  async post(endpoint, body, headers = {}) {
    // Invalidate affected cached entries on mutations
    this.clearCache('/admin/');
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  async put(endpoint, body, headers = {}) {
    this.clearCache('/admin/');
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  }

  async patch(endpoint, body, headers = {}) {
    this.clearCache('/admin/');
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers,
    });
  }

  async delete(endpoint, headers = {}) {
    this.clearCache('/admin/');
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

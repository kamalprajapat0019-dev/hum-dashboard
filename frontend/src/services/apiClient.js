import { appConfig } from '../config/appConfig';
import { storage } from '../utils/storage';

/**
 * Enterprise HTTP Client with Request/Response Interceptors, Bearer Tokens,
 * Safe Content-Type Validation, and Production-Grade Error Handling.
 */
class ApiClient {
  constructor(config = {}) {
    this.customBaseUrl = config.baseUrl;
    this.timeout = config.timeout || appConfig.api.timeout;
  }

  getBaseUrl() {
    return (this.customBaseUrl || appConfig.api.baseUrl || '/api/v1').replace(/\/+$/, '');
  }

  /**
   * Constructs the absolute or normalized URL, preventing duplicate `/api/v1` prefixes
   * and cleanly formatting query parameters.
   */
  buildUrl(endpoint, params) {
    const base = this.getBaseUrl();
    let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Prevent duplicate `/api/v1/api/v1` if both base and endpoint include it
    if (base.endsWith('/api/v1') && path.startsWith('/api/v1/')) {
      path = path.slice('/api/v1'.length);
    }

    let url = `${base}${path}`;

    if (params && typeof params === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return url;
  }

  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint, options.params);
    const method = (options.method || 'GET').toUpperCase();
    const token = storage.get(appConfig.auth.tokenStorageKey, 'session');

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
          // If status is 200 OK with HTML, this is a SPA fallback indicating wrong API base URL
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

        // Try parsing JSON if content-type was omitted but body is valid JSON
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
      return await response.json();
    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Request timeout or aborted after ${this.timeout}ms for endpoint: ${endpoint}`);
        timeoutErr.status = 408;
        timeoutErr.isTimeout = true;
        timeoutErr.endpoint = endpoint;
        timeoutErr.url = url;
        console.error(`[API Timeout] ${method} ${url}:`, timeoutErr.message);
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
    }
  }

  get(endpoint, options = {}) {
    const isOptionsObject = options && (options.headers || options.params || options.signal);
    const headers = isOptionsObject ? options.headers : options;
    const reqOptions = isOptionsObject ? { ...options, method: 'GET' } : { method: 'GET', headers };
    return this.request(endpoint, reqOptions);
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  }

  patch(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers,
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

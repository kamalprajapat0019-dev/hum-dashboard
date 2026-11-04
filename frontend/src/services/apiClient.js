import { appConfig } from '../config/appConfig';
import { storage } from '../utils/storage';

/**
 * Enterprise HTTP Client with Request/Response Interceptors, Bearer Tokens, and Timeouts
 */
class ApiClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || appConfig.api.baseUrl;
    this.timeout = config.timeout || appConfig.api.timeout;
  }

  async request(endpoint, options = {}) {
    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (options.params && typeof options.params === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

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

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const error = new Error(errorBody.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorBody;
        throw error;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Request timeout or aborted after ${this.timeout}ms`);
        timeoutErr.status = 408;
        throw timeoutErr;
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

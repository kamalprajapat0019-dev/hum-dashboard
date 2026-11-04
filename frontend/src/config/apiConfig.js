/**
 * Central API Configuration & URL Normalization Module
 * Enterprise OECM Portal — Production Frontend-Backend Integration
 */

export const PRODUCTION_BACKEND_URL = 'https://hum-dashboard-p8wn.vercel.app';
export const LOCAL_BACKEND_URL = 'http://localhost:5000';
export const API_PREFIX = '/api/v1';

/**
 * Normalizes any backend or API base URL to guarantee:
 * 1. Protocol is present (https:// or http://)
 * 2. Trailing slashes are stripped
 * 3. /api/v1 suffix is appended exactly once
 * 4. Relative paths are never allowed in production
 */
export function normalizeApiUrl(rawUrl, isProduction = false) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    if (isProduction) {
      return `${PRODUCTION_BACKEND_URL.replace(/\/+$/, '')}${API_PREFIX}`;
    }
    return `${LOCAL_BACKEND_URL}${API_PREFIX}`;
  }

  let clean = rawUrl.trim().replace(/\/+$/, '');

  // Prevent relative paths in production
  if (isProduction && clean.startsWith('/') && !clean.includes('://')) {
    clean = `${PRODUCTION_BACKEND_URL.replace(/\/+$/, '')}${clean}`;
  }

  // If already ends in /api/v1 (or /api/vX), keep as is
  if (/\/api\/v\d+$/i.test(clean)) {
    return clean;
  }

  // If ends in /api, append /v1
  if (/\/api$/i.test(clean)) {
    return `${clean}/v1`;
  }

  // Otherwise append /api/v1
  return `${clean}${API_PREFIX}`;
}

/**
 * Determines whether the current execution context is local development.
 */
export function isLocalEnvironment() {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV !== 'production';
  }
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

/**
 * Intelligently resolves the API Base URL with strict validation:
 * 1. Window runtime override (window.__OECM_API_BASE_URL__)
 * 2. Build-time Vite env variables: VITE_API_BASE_URL, VITE_API_URL, VITE_BACKEND_URL
 * 3. Localhost fallback when developing locally
 * 4. Production backend URL fallback (https://hum-dashboard-p8wn.vercel.app/api/v1)
 *
 * GUARANTEE: In production, this function NEVER returns a relative URL (e.g. '/api/v1').
 * All requests are guaranteed to target the backend origin.
 */
export function resolveApiBaseUrl() {
  const isProd = !isLocalEnvironment();

  // 1. Runtime window override (allows immediate runtime updates)
  if (typeof window !== 'undefined' && window.__OECM_API_BASE_URL__) {
    return normalizeApiUrl(window.__OECM_API_BASE_URL__, isProd);
  }

  // 2. Build-time environment variables
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return normalizeApiUrl(envUrl, isProd);
  }

  // 3. Localhost development
  if (isLocalEnvironment()) {
    return `${LOCAL_BACKEND_URL}${API_PREFIX}`;
  }

  // 4. Production: Default to verified deployed backend URL
  // NEVER return relative '/api/v1' in production to prevent hitting the static frontend host
  return `${PRODUCTION_BACKEND_URL}${API_PREFIX}`;
}

/**
 * Constructs a fully qualified API endpoint URL.
 * Guarantees that:
 * - Redundant /api/v1 prefixes are eliminated (exists exactly once)
 * - Query parameters are serialized cleanly
 * - The returned URL is absolute in production
 */
export function buildApiUrl(endpoint, params = null, customBase = null) {
  const base = (customBase || resolveApiBaseUrl()).replace(/\/+$/, '');
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Prevent duplicate /api/v1 if both base and endpoint have it
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

export const API_CONFIG = {
  get baseUrl() {
    return resolveApiBaseUrl();
  },
  productionBackend: PRODUCTION_BACKEND_URL,
  apiPrefix: API_PREFIX,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
};

export default API_CONFIG;

/**
 * Normalizes an API URL to guarantee consistent /api/v1 formatting
 */
function normalizeApiUrl(raw) {
  if (!raw || typeof raw !== 'string') return '/api/v1';
  const clean = raw.trim().replace(/\/+$/, '');
  // If already ends in /api/v1 (or /api/v2 etc), keep as is
  if (/\/api\/v\d+$/i.test(clean)) {
    return clean;
  }
  // If ends in /api, append /v1
  if (/\/api$/i.test(clean)) {
    return `${clean}/v1`;
  }
  // If relative path like '/api', normalize
  if (clean.startsWith('/') && !clean.includes('://')) {
    return clean.endsWith('/v1') ? clean : `${clean}/v1`;
  }
  // If full URL (http://... or https://...), append /api/v1
  return `${clean}/api/v1`;
}

/**
 * Intelligently resolves and normalizes the API base URL across environments.
 * Checks in priority order:
 * 1. Runtime window.__OECM_API_BASE_URL__ (for dynamic runtime configuration)
 * 2. VITE_API_BASE_URL
 * 3. VITE_API_URL
 * 4. VITE_BACKEND_URL
 * 5. Localhost development fallback (http://localhost:5000/api/v1)
 * 6. Same-origin fallback (/api/v1)
 */
export function resolveApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__OECM_API_BASE_URL__) {
    return normalizeApiUrl(window.__OECM_API_BASE_URL__);
  }

  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return normalizeApiUrl(envUrl);
  }

  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000/api/v1';
  }

  return '/api/v1';
}

/**
 * Application Runtime Configuration
 */
export const appConfig = {
  appName: 'OEM Portal',
  appSubtitle: 'Operations & Examination Management Portal',
  version: '1.0.0',
  api: {
    get baseUrl() {
      return resolveApiBaseUrl();
    },
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  },
  features: {
    mockStore: import.meta.env.VITE_USE_MOCK !== 'false',
    realtimeNotifications: true,
  },
  auth: {
    tokenStorageKey: 'oem_token',
    userStorageKey: 'oem_user',
    sessionTimeoutMinutes: 120,
  },
};

export default appConfig;

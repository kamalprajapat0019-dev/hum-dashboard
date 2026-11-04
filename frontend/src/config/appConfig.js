import {
  resolveApiBaseUrl,
  normalizeApiUrl,
  buildApiUrl,
  API_CONFIG,
  PRODUCTION_BACKEND_URL,
} from './apiConfig';

export {
  resolveApiBaseUrl,
  normalizeApiUrl,
  buildApiUrl,
  API_CONFIG,
  PRODUCTION_BACKEND_URL,
};

/**
 * Application Runtime Configuration
 */
export const appConfig = {
  appName: 'OEM Portal',
  appSubtitle: 'Operations & Examination Management Portal',
  version: '1.0.0',
  api: API_CONFIG,
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

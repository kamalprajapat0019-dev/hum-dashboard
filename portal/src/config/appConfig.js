/**
 * Application Runtime Configuration
 */
export const appConfig = {
  appName: 'OEM Portal',
  appSubtitle: 'Operations & Examination Management Portal',
  version: '1.0.0',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
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

import { describe, it, expect } from 'vitest';
import {
  normalizeApiUrl,
  buildApiUrl,
  PRODUCTION_BACKEND_URL,
} from '../../frontend/src/config/apiConfig.js';

describe('Production API URL Resolution & Normalization Audit', () => {
  it('should normalize origin URL without /api/v1 to include /api/v1', () => {
    const input = 'https://hum-dashboard-p8wn.vercel.app';
    const output = normalizeApiUrl(input, true);
    expect(output).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1');
  });

  it('should preserve URL that already includes /api/v1', () => {
    const input = 'https://hum-dashboard-p8wn.vercel.app/api/v1';
    const output = normalizeApiUrl(input, true);
    expect(output).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1');
  });

  it('should strip trailing slashes and append /api/v1', () => {
    const input = 'https://hum-dashboard-p8wn.vercel.app/';
    const output = normalizeApiUrl(input, true);
    expect(output).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1');
  });

  it('should normalize /api to /api/v1', () => {
    const input = 'https://hum-dashboard-p8wn.vercel.app/api';
    const output = normalizeApiUrl(input, true);
    expect(output).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1');
  });

  it('should reject relative path in production and prepend production backend origin', () => {
    const input = '/api/v1';
    const output = normalizeApiUrl(input, true);
    expect(output).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1');
  });

  it('should fallback to production backend if input is empty or null in production', () => {
    const outputNull = normalizeApiUrl(null, true);
    expect(outputNull).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1');

    const outputEmpty = normalizeApiUrl('', true);
    expect(outputEmpty).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1');
  });

  it('should construct exact expected production URLs for all core dashboard endpoints', () => {
    const prodBase = 'https://hum-dashboard-p8wn.vercel.app/api/v1';

    // 1. Projects endpoint
    const projectsUrl = buildApiUrl('/admin/projects', null, prodBase);
    expect(projectsUrl).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1/admin/projects');

    // 2. Analytics endpoint
    const analyticsUrl = buildApiUrl('/admin/analytics', null, prodBase);
    expect(analyticsUrl).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1/admin/analytics');

    // 3. Clients endpoint
    const clientsUrl = buildApiUrl('/admin/clients', null, prodBase);
    expect(clientsUrl).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1/admin/clients');

    // 4. Query parameters
    const queryUrl = buildApiUrl('/admin/projects', { clientId: 'c123', limit: 100 }, prodBase);
    expect(queryUrl).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1/admin/projects?clientId=c123&limit=100');

    // 5. Duplicate prefix prevention (/api/v1/api/v1/...)
    const duplicatePrefixUrl = buildApiUrl('/api/v1/admin/analytics', null, prodBase);
    expect(duplicatePrefixUrl).toBe('https://hum-dashboard-p8wn.vercel.app/api/v1/admin/analytics');
  });
});

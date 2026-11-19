/**
 * Safe Browser Storage Helpers
 */

/**
 * Safe Browser Storage Helpers
 */

const AUTH_KEYS = ['oem_token', 'oem_refresh_token', 'oem_user'];

export const storage = {
  get(key, storageType = 'session') {
    try {
      if (storageType === 'local') {
        const item = window.localStorage.getItem(key);
        if (!item) return null;
        try { return JSON.parse(item); } catch { return item; }
      }

      // Default: Check sessionStorage first, fall back to localStorage
      let item = window.sessionStorage.getItem(key);
      if (!item) {
        item = window.localStorage.getItem(key);
      }
      if (!item) return null;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (e) {
      console.warn(`[storage] Error reading key "${key}":`, e);
      return null;
    }
  },

  set(key, value, storageType = 'session') {
    try {
      const serialized = JSON.stringify(value);
      if (storageType === 'local' || AUTH_KEYS.includes(key)) {
        window.localStorage.setItem(key, serialized);
      }
      window.sessionStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.warn(`[storage] Error saving key "${key}":`, e);
      return false;
    }
  },

  remove(key, storageType) {
    try {
      if (storageType === 'local') {
        window.localStorage.removeItem(key);
      } else if (storageType === 'session') {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.removeItem(key);
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[storage] Error removing key "${key}":`, e);
    }
  },

  clear(storageType) {
    try {
      if (storageType === 'local') {
        window.localStorage.clear();
      } else if (storageType === 'session') {
        window.sessionStorage.clear();
      } else {
        window.sessionStorage.clear();
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn(`[storage] Error clearing storage:`, e);
    }
  },
};

export default storage;

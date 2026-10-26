/**
 * Safe Browser Storage Helpers
 */

export const storage = {
  get(key, storageType = 'session') {
    try {
      const store = storageType === 'local' ? window.localStorage : window.sessionStorage;
      const item = store.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn(`[storage] Error reading key "${key}":`, e);
      return null;
    }
  },

  set(key, value, storageType = 'session') {
    try {
      const store = storageType === 'local' ? window.localStorage : window.sessionStorage;
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[storage] Error saving key "${key}":`, e);
      return false;
    }
  },

  remove(key, storageType = 'session') {
    try {
      const store = storageType === 'local' ? window.localStorage : window.sessionStorage;
      store.removeItem(key);
    } catch (e) {
      console.warn(`[storage] Error removing key "${key}":`, e);
    }
  },

  clear(storageType = 'session') {
    try {
      const store = storageType === 'local' ? window.localStorage : window.sessionStorage;
      store.clear();
    } catch (e) {
      console.warn(`[storage] Error clearing storage:`, e);
    }
  },
};

export default storage;

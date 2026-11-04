import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';
import { storage } from '../utils/storage';

const ClientContext = createContext(null);

const STORAGE_KEY = 'oecm_admin_selected_client_id';

/**
 * Exact Enterprise Clients from MySQL Database (oecm_clients):
 * 1. Eduquity (ID: cmvuiz0mv0006ugkkf86q4hpt)
 * 2. Edu-Spark (ID: cmvuiz0sp0007ugkkxc8nblu7)
 */
export const VERIFIED_ENTERPRISE_CLIENTS = [
  {
    id: 'cmvuiz0mv0006ugkkf86q4hpt',
    code: 'CL-EDQ',
    name: 'Eduquity',
    fullName: 'Eduquity Career Technologies',
    status: 'Active',
    isActive: true,
  },
  {
    id: 'cmvuiz0sp0007ugkkxc8nblu7',
    code: 'CL-ESP',
    name: 'Edu-Spark',
    fullName: 'Edu-Spark Global Services',
    status: 'Active',
    isActive: true,
  },
];

export const ALLOWED_CLIENT_NAMES = ['Eduquity', 'Edu-Spark'];

export function ClientProvider({ children }) {
  // Pre-seed with verified MySQL enterprise client records so dropdown is never blank
  const [clients, setClients] = useState(VERIFIED_ENTERPRISE_CLIENTS);
  const [selectedClientId, setSelectedClientIdState] = useState(() => {
    const stored = storage.get(STORAGE_KEY, 'local');
    if (stored && (stored === VERIFIED_ENTERPRISE_CLIENTS[0].id || stored === VERIFIED_ENTERPRISE_CLIENTS[1].id)) {
      return stored;
    }
    return VERIFIED_ENTERPRISE_CLIENTS[0].id; // Default to Eduquity
  });
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientError, setClientError] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    setClientError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.ADMIN.CLIENTS, { params: { limit: 100 } });
      if (res?.success && Array.isArray(res.data)) {
        // Filter specifically for the 2 enterprise clients
        const enterpriseClients = res.data.filter((c) => {
          const n = (c.name || '').toLowerCase();
          return n.includes('eduquity') || n.includes('edu-spark') || n.includes('eduspark');
        });

        // Ensure Eduquity is first, Edu-Spark is second
        enterpriseClients.sort((a, b) => {
          const aIsEdu = a.name.toLowerCase().includes('eduquity');
          const bIsEdu = b.name.toLowerCase().includes('eduquity');
          if (aIsEdu && !bIsEdu) return -1;
          if (!aIsEdu && bIsEdu) return 1;
          return 0;
        });

        if (enterpriseClients.length > 0) {
          setClients(enterpriseClients);

          // Verify stored client ID is valid among enterprise clients
          const storedId = storage.get(STORAGE_KEY, 'local');
          const validStored = enterpriseClients.find((c) => c.id === storedId);

          if (validStored) {
            setSelectedClientIdState(validStored.id);
          } else {
            // Default to Eduquity
            const eduquityClient =
              enterpriseClients.find((c) => c.name.toLowerCase().includes('eduquity')) ||
              enterpriseClients[0];
            if (eduquityClient) {
              setSelectedClientIdState(eduquityClient.id);
              storage.set(STORAGE_KEY, eduquityClient.id, 'local');
            }
          }
        }
      } else {
        throw new Error(res?.message || 'Failed to retrieve clients list');
      }
    } catch (err) {
      console.warn('Using verified enterprise client database records:', err.message);
      setClientError(err.message || 'Unable to refresh clients');
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const setSelectedClientId = useCallback((clientId) => {
    setSelectedClientIdState(clientId);
    if (clientId) {
      storage.set(STORAGE_KEY, clientId, 'local');
    } else {
      storage.remove(STORAGE_KEY, 'local');
    }
  }, []);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  const value = useMemo(
    () => ({
      clients,
      selectedClientId,
      selectedClient,
      setSelectedClientId,
      loadingClients,
      clientError,
      refreshClients: fetchClients,
      ALLOWED_CLIENT_NAMES,
    }),
    [clients, selectedClientId, selectedClient, setSelectedClientId, loadingClients, clientError, fetchClients]
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClientFilter() {
  const ctx = useContext(ClientContext);
  if (!ctx) {
    console.warn('[ClientContext] useClientFilter called outside ClientProvider. Returning verified enterprise client fallback.');
    return {
      clients: VERIFIED_ENTERPRISE_CLIENTS,
      selectedClientId: VERIFIED_ENTERPRISE_CLIENTS[0].id,
      selectedClient: VERIFIED_ENTERPRISE_CLIENTS[0],
      setSelectedClientId: () => {},
      loadingClients: false,
      clientError: null,
      refreshClients: () => Promise.resolve(),
      ALLOWED_CLIENT_NAMES,
    };
  }
  return ctx;
}

export const useClient = useClientFilter;

export default ClientContext;

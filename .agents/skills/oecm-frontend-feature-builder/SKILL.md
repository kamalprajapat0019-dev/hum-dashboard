---
name: oecm-frontend-feature-builder
description: Component architecture, API integration, state management, and RBAC UI guidelines for building React 19 + Vite features in OECM Portal. Use when creating or updating UI pages, components, modals, tables, forms, or connecting to apiClient.
---

# OECM Frontend Feature Builder Skill

This skill governs the development of frontend features, views, and components in the **OECM Portal** using **React 19**, **Vite**, and modular design system primitives.

---

## 1. Directory Placement Conventions

- **Feature Modules**: Every domain feature resides in `frontend/src/features/<feature-name>/`:
  ```
  frontend/src/features/projects/
  ├── components/
  │   ├── ExamFormModal.jsx
  │   ├── ExamKpiCards.jsx
  │   ├── ExamsTable.jsx
  │   ├── ProjectFormModal.jsx
  │   └── index.js
  ├── ProjectsPage.jsx
  └── index.js
  ```
- **Role Hubs**: Role-specific workspaces and navigation configs reside in `frontend/src/roles/<role-name>/` (e.g. `centre-user`, `operations`, `auditor`, `finance`, `pm`, `admin`).
- **Forbidden**: Never place components in `frontend/src/pages/` (legacy directory is removed).

---

## 2. Reusing Design System Primitives

Always reuse existing common components from `@/components/common` rather than writing ad-hoc wrappers:

| Primitive | Path | Usage |
| :--- | :--- | :--- |
| `KpiCard` | `@/components/common` | Metric/summary cards with icons, labels, and deltas |
| `StatusBadge` | `@/components/common` | Unified badge rendering for workflows (`Draft`, `Registered`, `Approved`, etc.) |
| `LastUpdated` | `@/components/common` | Real-time timestamp pill with auto-refresh counter |
| `ProgressBar` / `ProgressRing` | `@/components/common` | Completion metrics (e.g., document compliance percentage) |
| Feedback Modals | `@/components/feedback` | Confirmation dialogs, alerts, and toasts |

---

## 3. Standard API Integration via `apiClient` & `endpoints.js`

1. **Centralized Endpoints**: Add all route URLs to `frontend/src/services/endpoints.js`:
   ```javascript
   export const ENDPOINTS = {
     CENTRE_PORTAL: {
       MY_CENTRE: '/centre/my-centre',
       DRAFT: '/centre/draft',
       UPLOAD_DOC: '/centre/documents/upload',
       SUBMIT: '/centre/submit',
       STATUS: '/centre/status',
     },
   };
   ```
2. **Standard API Client**: Never call `fetch()` directly in UI views. Always use `apiClient`:
   ```javascript
   import { apiClient } from '@/services/apiClient';
   import { ENDPOINTS } from '@/services/endpoints';

   // GET:
   const res = await apiClient.get(ENDPOINTS.CENTRE_PORTAL.MY_CENTRE);
   if (res && res.success && res.data) {
     setCentreProfile(res.data);
   }

   // POST:
   const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.DRAFT, payload);
   ```

---

## 4. Mandatory 4-State UX Lifecycle

Every data-driven page and widget must explicitly handle all 4 lifecycle states:

```jsx
export default function FeatureView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.FEATURE.LIST);
      setData(res.data);
    } catch (err) {
      setError(err?.message || 'Failed to load feature data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 1. Loading State
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
        Loading records from database...
      </div>
    );
  }

  // 2. Error State with Retry CTA
  if (error) {
    return (
      <div className="error-banner" style={{ background: '#fee2e2', border: '1px solid #ef4444', padding: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span><strong>Error:</strong> {error}</span>
          <button className="btn btn-sm btn-secondary" onClick={loadData}>Retry</button>
        </div>
      </div>
    );
  }

  // 3. Empty State with Action CTA
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ textAlign: 'center', padding: '48px 0' }}>
        <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.5, display: 'block' }} />
        <h3>No Records Found</h3>
        <p>Get started by creating your first entry.</p>
        <button className="btn btn-primary" onClick={handleCreate}>Add New</button>
      </div>
    );
  }

  // 4. Success State (Render Data Table / Grid)
  return <DataGrid items={data} />;
}
```

---

## 5. Role-Based Access Control (RBAC) in Components

All privileged actions (e.g. Delete User, Approve Centre, Create Project, Edit Commercials) must be gated by permissions using `useAuth`:

```jsx
import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS } from '@/constants/permissions';

export function ActionToolbar({ onApprove, onReject }) {
  const { hasAccess } = useAuth();

  const canApprove = hasAccess(PERMISSIONS.CENTRE_VERIFY);
  const canDelete = hasAccess(PERMISSIONS.MANAGE_USERS);

  return (
    <div className="actions">
      {canApprove && (
        <button className="btn btn-success" onClick={onApprove}>
          Approve Centre
        </button>
      )}
      {canDelete && (
        <button className="btn btn-danger" onClick={onReject}>
          Reject Application
        </button>
      )}
    </div>
  );
}
```

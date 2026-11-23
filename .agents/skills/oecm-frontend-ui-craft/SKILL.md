---
name: oecm-frontend-ui-craft
description: Guidelines and design system standards for crafting clean, accessible, and responsive user interfaces in the OECM Portal using tokens.css, typography.css, and reusable UI components. Use when building or styling pages, forms, modals, tables, and feedback states.
---

# OECM Frontend UI Craft Skill

This skill defines the visual hierarchy, token usage, layout ergonomics, accessibility standards, and state handling rules for the **Operations & Examination Management Portal (OECM Portal)** frontend built with **React 19** and **Vite**.

---

## 1. Design Token Governance (`tokens.css` & `typography.css`)

Never hardcode arbitrary hex colors, inline margins, or ad-hoc border radii. Always use CSS custom properties defined in `frontend/src/styles/tokens.css` and `typography.css`:

### 🎨 Color Palette
- **Brand & Primary**:
  - `var(--color-primary)` (`#2563eb`) — Primary action buttons, active navigation, active tabs.
  - `var(--color-primary-dark)` (`#1d4ed8`) — Button hover, dark brand accents.
  - `var(--color-accent)` (`#0d9488`) — Highlights and secondary KPIs.
- **Surfaces & Backgrounds**:
  - `var(--bg-base)` (`#e9eef5`) — App viewport background.
  - `var(--bg-surface)` (`#ffffff`) — Cards, modals, drawers, dropdown menus.
  - `var(--bg-subtle)` (`#f1f5f9`) — Table headers, read-only field containers, subtle pill backgrounds.
  - `var(--bg-hover)` (`#e2e8f0`) — Table row hover, secondary button hover.
- **Text & Content**:
  - `var(--text-primary)` (`#172033`) — Primary headings and table cell values.
  - `var(--text-secondary)` (`#64748b`) — Descriptions, subtitles, and input labels.
  - `var(--text-muted)` (`#94a3b8`) — Timestamps, placeholder text, and secondary metadata.
- **Status Semantic Tokens**:
  - Success: `var(--color-success)` (`#16a34a`), background: `var(--color-success-bg)`, border: `var(--color-success-border)`.
  - Warning: `var(--color-warning)` (`#d97706`), background: `var(--color-warning-bg)`, border: `var(--color-warning-border)`.
  - Danger / Error: `var(--color-danger)` (`#dc2626`), background: `var(--color-danger-bg)`, border: `var(--color-danger-border)`.
  - Info: `var(--color-info)` (`#0284c7`), background: `var(--color-info-bg)`, border: `var(--color-info-border)`.

### 📏 Spacing & Radii
- Spacing: `var(--space-xs, 4px)`, `var(--space-sm, 8px)`, `var(--space-md, 16px)`, `var(--space-lg, 24px)`, `var(--space-xl, 32px)`.
- Radii: `var(--radius-sm, 4px)`, `var(--radius-md, 8px)`, `var(--radius-lg, 12px)`, `var(--radius-full, 9999px)`.

---

## 2. Component Composition & Reuse

Do not build custom table layouts, modal backdrops, or form controls from scratch when existing components exist:

| Component Category | Canonical Directory | Reusable Primitives |
| :--- | :--- | :--- |
| **Common & KPI** | `@/components/common` | `KpiCard`, `StatusBadge`, `LastUpdated`, `ProgressBar`, `ProgressRing` |
| **Tables & Lists** | `@/components/tables` | Table wrappers, sortable headers, pagination controls, filter bars |
| **Forms & Controls** | `@/components/forms` | Form groups, floating labels, custom selects, search inputs |
| **Modals & Dialogs** | `@/components/modals` | Modal shells, confirmation dialogues, drawer containers |
| **Feedback & UX** | `@/components/feedback`| Toast notifications, Alert banners, Skeleton loaders |
| **UI Primitives** | `@/components/ui` | Buttons (`btn btn-primary`, `btn-secondary`), Tabs, Dropdowns |

---

## 3. Visual Hierarchy & Spacing Consistency

1. **Page Headers**:
   Every top-level view must render a standardized page header:
   ```jsx
   <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
     <div className="page-header__top">
       <div>
         <h1 className="page-header__title">{title}</h1>
         <p className="page-header__subtitle">{subtitle}</p>
       </div>
       <div className="page-header__actions" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
         <button className="btn btn-secondary btn-sm" onClick={loadData}>
           <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
         </button>
         <LastUpdated />
       </div>
     </div>
   </div>
   ```
2. **KPI Grids**:
   KPI summary cards must sit in a responsive auto-fit grid above main content tables:
   ```jsx
   <div className="kpi-grid" style={{ marginBottom: 'var(--space-lg)' }}>
     <KpiCard label="Total Items" value={stats.total} icon="Layers" />
     <KpiCard label="Active" value={stats.active} icon="CheckCircle" />
     <KpiCard label="Pending Review" value={stats.pending} icon="Clock" />
   </div>
   ```
3. **Card Shells**: Wrap content sections in `.card` containers featuring distinct `.card-header` and `.card-body` padding.

---

## 4. Accessibility & Modal Ergonomics

1. **Accessible Labels**:
   - Every input field must have an explicit `<label htmlFor="...">` and matching `id`.
   - Mandatory fields must visually display an asterisk (`*`) and include the `required` or `aria-required="true"` attribute.
2. **Modal Ergonomics**:
   - Always prevent event propagation on modal card clicks: `<div className="modal" onClick={(e) => e.stopPropagation()}>`.
   - Support `Escape` key listeners to dismiss open modals.
   - Disable submission buttons and show a spinner while an asynchronous save operation is active:
     ```jsx
     <button className="btn btn-primary" type="submit" disabled={submitting}>
       {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
       {submitting ? 'Saving...' : 'Confirm & Save'}
     </button>
     ```

---

## 5. Mandatory 4-State Lifecycle on Every View

Every asynchronous view must cleanly render across all four operational states:

1. **Loading State**:
   Never leave the user on a blank screen. Display skeleton place-holders or centered spinning loader indicators:
   ```jsx
   if (loading) {
     return (
       <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
         <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
         Loading data from database...
       </div>
     );
   }
   ```
2. **Error State with Retry Action**:
   Never fail silently. Render a user-friendly error notification with a "Retry" button:
   ```jsx
   if (error) {
     return (
       <div className="error-banner" style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', padding: 16, borderRadius: 'var(--radius-md)' }}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-danger)' }}>
           <span><strong>Notice:</strong> {error}</span>
           <button className="btn btn-sm btn-secondary" onClick={loadData}>Retry</button>
         </div>
       </div>
     );
   }
   ```
3. **Empty State**:
   When no records match the criteria, display a contextual icon, an explanatory message, and a clear action CTA:
   ```jsx
   if (!data || data.length === 0) {
     return (
       <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
         <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.5, display: 'block' }} />
         <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No Records Found</div>
         <p style={{ fontSize: '0.8125rem', marginTop: 4 }}>Get started by creating your first record.</p>
         <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)} style={{ marginTop: 12 }}>
           Create Record
         </button>
       </div>
     );
   }
   ```
4. **Data View**: Render tables with zebra-striping on hover, clear column headers, and monospace font styling for identifiers (`centreCode`, `projectCode`, `examCode`).

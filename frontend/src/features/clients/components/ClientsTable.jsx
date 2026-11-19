import React from 'react';
import { Search, Building2, Loader2, User, Mail, Power, CheckCircle2, X } from 'lucide-react';
import { StatusBadge, ActionGroup, ViewAction, EditAction, IconButton } from '@/components/common';

export function ClientsTable({
  clients = [],
  loading = false,
  totalCount = 0,
  page = 1,
  limit = 10,
  totalPages = 1,
  search = '',
  statusFilter = '',
  onSearchChange,
  onStatusFilterChange,
  onResetFilters,
  onPageChange,
  onLimitChange,
  onOpenView,
  onOpenEdit,
  onOpenStatus,
  onCopy,
  canManageClients = true,
}) {
  return (
    <div className="card">
      {/* Card Header & Filter Controls */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        {/* Search Box */}
        <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Client ID, Name, Rep..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            style={{ paddingLeft: 32, fontSize: '0.8125rem', height: 38 }}
          />
          {search && (
            <button
              onClick={onResetFilters}
              style={{ position: 'absolute', right: 10, top: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange?.(e.target.value)}
          style={{ width: 150, fontSize: '0.8125rem', height: 38 }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {(search || statusFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onResetFilters}
            style={{ fontSize: '0.75rem', height: 38 }}
          >
            Reset Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Showing <strong>{clients.length}</strong> of <strong>{totalCount}</strong> clients
        </div>
      </div>

      {/* Client Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: 70, textAlign: 'center' }}>S. NO.</th>
              <th style={{ width: 140 }}>CLIENT ID</th>
              <th style={{ minWidth: 160 }}>CLIENT NAME</th>
              <th style={{ minWidth: 180 }}>REPRESENTATIVE NAME</th>
              <th style={{ minWidth: 220 }}>OFFICIAL EMAIL ID</th>
              <th style={{ width: 140, textAlign: 'center' }}>TOTAL NO. OF EXAMS</th>
              <th style={{ width: 130, textAlign: 'center' }}>ACTIVE EXAMS</th>
              <th style={{ width: 120, textAlign: 'center' }}>STATUS</th>
              <th style={{ width: 140, textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                  Loading client directory from database...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <Building2 size={32} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
                  No client organisations match your query.
                </td>
              </tr>
            ) : (
              clients.map((c, idx) => {
                const serialNumber = (page - 1) * limit + idx + 1;
                const clientIdDisplay = c.code || c.id;
                const isActive = c.status === 'Active';

                return (
                  <tr key={c.id}>
                    {/* S. No. */}
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {serialNumber}
                    </td>

                    {/* Client ID (Double-click to copy) */}
                    <td>
                      <span
                        onDoubleClick={() => onCopy?.(clientIdDisplay, 'Client ID')}
                        title="Double-click to copy Client ID"
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--color-primary, #1e40af)',
                          cursor: 'copy',
                          background: 'rgba(30, 64, 175, 0.08)',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}
                      >
                        {clientIdDisplay}
                      </span>
                    </td>

                    {/* Client Name */}
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {c.name}
                      </span>
                      {c.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {c.description}
                        </div>
                      )}
                    </td>

                    {/* Client Representative Name */}
                    <td>
                      <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{c.fullName || '—'}</span>
                      </div>
                    </td>

                    {/* Client Representative Official Email ID */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                        <a
                          href={`mailto:${c.contactEmail}`}
                          style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                          title="Send email"
                        >
                          {c.contactEmail || '—'}
                        </a>
                      </div>
                    </td>

                    {/* Total No. of Exams */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {c.totalExams ?? (c._count?.projects || 0)} Exams
                      </span>
                    </td>

                    {/* Active Exams */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {c.activeExams ?? 0} Active
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: 'center' }}>
                      <StatusBadge status={c.status || 'Active'} />
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <ActionGroup style={{ justifyContent: 'center' }}>
                        <ViewAction
                          onClick={() => onOpenView?.(c)}
                          tooltip="View Client Profile & Associated Projects"
                        />
                        {canManageClients && (
                          <>
                            <EditAction
                              onClick={() => onOpenEdit?.(c)}
                              tooltip="Edit Client Information"
                            />
                            {onOpenStatus && (
                              <IconButton
                                onClick={() => onOpenStatus(c)}
                                tooltip={isActive ? 'Deactivate Client' : 'Activate Client'}
                                variant={isActive ? 'danger' : 'success'}
                                icon={isActive ? <Power size={13} /> : <CheckCircle2 size={13} />}
                              />
                            )}
                          </>
                        )}
                      </ActionGroup>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="card-footer" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange?.(Number(e.target.value))}
            className="form-control"
            style={{ width: 70, height: 32, padding: '2px 8px', fontSize: '0.8125rem' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pNum = i + 1;
            if (totalPages > 5 && page > 3) {
              pNum = page - 2 + i;
              if (pNum > totalPages) pNum = totalPages - (4 - i);
            }
            return (
              <button
                key={pNum}
                className={`btn btn-sm ${page === pNum ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onPageChange?.(pNum)}
                style={{ minWidth: 32, padding: '4px 8px' }}
              >
                {pNum}
              </button>
            );
          })}
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export { ClientsTable as ClientTable };

import React from 'react';
import {
  Search, X, RefreshCw, ArrowUpDown,
  Users, Key, ChevronLeft, ChevronRight,
  Phone, Eye, Pencil, UserX, UserCheck
} from 'lucide-react';
import { StatusBadge } from '@/components/common';

export function UserTable({
  users = [],
  loading = false,
  totalRecords = 0,
  page = 1,
  limit = 10,
  totalPages = 1,
  sortBy = 'name',
  sortOrder = 'asc',
  search = '',
  debouncedSearch = '',
  roleFilter = '',
  statusFilter = '',
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onLimitChange,
  onSort,
  onPageChange,
  onViewUser,
  onEditUser,
  onToggleStatus,
  onResetPassword,
  onCopyUserId,
  currentUser,
  ROLE_LABELS = {},
  ROLE_COLORS = {},
}) {
  return (
    <div className="card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      {/* Table Filters Header */}
      <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, phone, or ID..."
            value={search}
            onChange={e => onSearchChange?.(e.target.value)}
            style={{ paddingLeft: 34, fontSize: '0.8125rem', height: 38 }}
          />
          {search && (
            <button
              onClick={() => onSearchChange?.('')}
              style={{ position: 'absolute', right: 10, top: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters & Page Size */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Role Filter */}
          <select
            className="form-control"
            value={roleFilter}
            onChange={e => {
              onRoleFilterChange?.(e.target.value);
              onPageChange?.(1);
            }}
            style={{ width: 175, fontSize: '0.8125rem', height: 38 }}
          >
            <option value="">All Roles</option>
            <option value="project_manager">Project Manager</option>
            <option value="accounts_finance">Accounts / Finance</option>
            <option value="operations_executive">Operations Executive</option>
            <option value="auditor_it">Auditor / IT</option>
            <option value="centre_user">Centre User</option>
            <option value="admin">Administrator</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-control"
            value={statusFilter}
            onChange={e => {
              onStatusFilterChange?.(e.target.value);
              onPageChange?.(1);
            }}
            style={{ width: 130, fontSize: '0.8125rem', height: 38 }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Page Size */}
          <select
            className="form-control"
            value={limit}
            onChange={e => onLimitChange?.(Number(e.target.value))}
            style={{ width: 110, fontSize: '0.8125rem', height: 38 }}
            title="Rows per page"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* User Listing Table */}
      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', width: 70, textAlign: 'center' }}>
                S. No.
              </th>
              <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', width: 120 }}>
                User ID
              </th>
              <th
                onClick={() => onSort?.('name')}
                style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>User Name</span>
                  <ArrowUpDown size={12} color={sortBy === 'name' ? 'var(--color-primary)' : '#94a3b8'} />
                </div>
              </th>
              <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                User Email
              </th>
              <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                Phone No.
              </th>
              <th
                onClick={() => onSort?.('createdAt')}
                style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Created Date</span>
                  <ArrowUpDown size={12} color={sortBy === 'createdAt' ? 'var(--color-primary)' : '#94a3b8'} />
                </div>
              </th>
              <th
                onClick={() => onSort?.('updatedAt')}
                style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Last Updated</span>
                  <ArrowUpDown size={12} color={sortBy === 'updatedAt' ? 'var(--color-primary)' : '#94a3b8'} />
                </div>
              </th>
              <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                Status
              </th>
              <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textAlign: 'center', width: 220 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <RefreshCw size={24} className="animate-spin" color="var(--color-primary)" />
                    <span>Loading user records from database...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Users size={32} color="#cbd5e1" />
                    <div style={{ fontWeight: 600, color: '#475569' }}>No users found</div>
                    <div style={{ fontSize: '0.8125rem' }}>
                      {debouncedSearch || roleFilter || statusFilter
                        ? 'Try adjusting your search criteria or filters.'
                        : 'No user records exist in the database yet.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u, idx) => {
                const roleColor = ROLE_COLORS[u.role] || '#64748b';
                const roleLabel = ROLE_LABELS[u.role] || u.role;
                const isActive = u.status === 'Active';
                const isSelf = currentUser?.id === u.id;
                const serialNumber = (page - 1) * limit + idx + 1;

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* S. No. (Continuous) */}
                    <td style={{ padding: '14px 16px', fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textAlign: 'center' }}>
                      {serialNumber}
                    </td>

                    {/* User ID */}
                    <td
                      style={{ padding: '14px 16px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569', cursor: 'copy', userSelect: 'none' }}
                      title="Double-click to copy complete User ID"
                      onDoubleClick={(e) => onCopyUserId?.(e, u.id)}
                    >
                      <span
                        title="Double-click to copy complete User ID"
                        style={{ cursor: 'copy', userSelect: 'none' }}
                      >
                        {u.id.length > 10 ? `${u.id.slice(0, 8)}…` : u.id}
                      </span>
                    </td>

                    {/* User Name & Role Tag */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                        {u.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: `${roleColor}15`,
                          color: roleColor,
                          border: `1px solid ${roleColor}30`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {roleLabel}
                        </span>
                        {u.manager && (
                          <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }} title={`Managed by ${u.manager.name}`}>
                            • Rep to: {u.manager.name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* User Email */}
                    <td style={{ padding: '14px 16px', fontSize: '0.8125rem', fontFamily: 'monospace', color: '#334155' }}>
                      {u.email}
                    </td>

                    {/* Phone No. */}
                    <td style={{ padding: '14px 16px', fontSize: '0.8125rem', color: '#475569' }}>
                      {u.phoneNumber ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={12} color="#94a3b8" /> {u.phoneNumber}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: '#64748b' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}
                    </td>

                    {/* Last Updated Date */}
                    <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: '#64748b' }}>
                      {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('en-GB') : '—'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <StatusBadge status={u.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {/* View Button */}
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onViewUser?.(u)}
                          title="View full user profile"
                          style={{ padding: '5px 8px' }}
                        >
                          <Eye size={13} />
                        </button>

                        {/* Edit Button */}
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onEditUser?.(u)}
                          title="Edit user details and scope"
                          style={{ padding: '5px 8px' }}
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Activate / Deactivate Toggle Button */}
                        <button
                          className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => onToggleStatus?.(u)}
                          disabled={isSelf}
                          title={isSelf ? 'Cannot deactivate your own account' : (isActive ? 'Deactivate user account' : 'Activate user account')}
                          style={{
                            padding: '5px 8px',
                            color: isSelf ? '#cbd5e1' : (isActive ? '#dc2626' : '#16a34a'),
                            borderColor: isActive ? '#fecaca' : '#bbf7d0',
                            background: isActive ? '#fef2f2' : '#f0fdf4'
                          }}
                        >
                          {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>

                        {/* Reset Password Button */}
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onResetPassword?.(u)}
                          title="Initiate single-use password reset link"
                          style={{ padding: '5px 8px', color: '#2563eb' }}
                        >
                          <Key size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
          Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalRecords)} of {totalRecords} users
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', padding: '0 8px' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

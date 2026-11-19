import React from 'react';
import { Loader2 } from 'lucide-react';
import { StatusBadge, ActionGroup, ViewAction, EditAction } from '@/components/common';

export function ProjectsTable({
  loading,
  paginatedProjects = [],
  filteredProjects = [],
  clients = [],
  clientFilter = '',
  setClientFilter,
  statusFilter = '',
  setStatusFilter,
  yearFilter = '',
  setYearFilter,
  availableFinancialYears = [],
  projectPage = 1,
  setProjectPage,
  projectLimit = 10,
  setProjectLimit,
  totalProjectPages = 1,
  handleToggleProjectStatus,
  handleOpenViewProject,
  handleOpenEditProject,
  showToast,
  getProjectCandidateTarget,
  getFinancialYear,
}) {
  return (
    <div className="card">
      {/* Approved Filter Bar: Client, Status, Financial Year ONLY */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        {/* 1. Client Filter */}
        <select
          className="form-control"
          value={clientFilter}
          onChange={e => {
            setClientFilter(e.target.value);
            setProjectPage(1);
          }}
          style={{ width: 180, fontSize: '0.8125rem' }}
        >
          <option value="">All Clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* 2. Status Filter */}
        <select
          className="form-control"
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setProjectPage(1);
          }}
          style={{ width: 140, fontSize: '0.8125rem' }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="OnHold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Closed">Closed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* 3. Financial Year Filter */}
        <select
          className="form-control"
          value={yearFilter}
          onChange={e => {
            if (setYearFilter) setYearFilter(e.target.value);
            setProjectPage(1);
          }}
          style={{ width: 160, fontSize: '0.8125rem' }}
        >
          <option value="">All Financial Years</option>
          {availableFinancialYears.map(yr => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>

        {/* Reset Filter Button */}
        {(clientFilter || statusFilter || yearFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setClientFilter('');
              setStatusFilter('');
              if (setYearFilter) setYearFilter('');
              setProjectPage(1);
            }}
            style={{ fontSize: '0.75rem' }}
          >
            Reset
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Showing <strong>{paginatedProjects.length}</strong> of <strong>{filteredProjects.length}</strong> projects
        </div>
      </div>

      {/* Approved 7-Column Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: 140 }}>PROJECT CODE</th>
              <th style={{ minWidth: 200 }}>PROJECT NAME</th>
              <th style={{ minWidth: 160 }}>CLIENT</th>
              <th style={{ width: 160 }}>CANDIDATE TARGET</th>
              <th style={{ width: 150 }}>FINANCIAL YEAR</th>
              <th style={{ width: 120 }}>STATUS</th>
              <th style={{ width: 110, textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                  Querying projects from database...
                </td>
              </tr>
            ) : paginatedProjects.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No examination projects found matching current filters. Click &quot;Setup New Project&quot; to initialize one.
                </td>
              </tr>
            ) : (
              paginatedProjects.map((p) => {
                const candidateTarget = getProjectCandidateTarget
                  ? getProjectCandidateTarget(p)
                  : Number(p.candidateTarget || 0);

                const financialYear = getFinancialYear
                  ? getFinancialYear(p)
                  : (p.financialYear || '2026-2027');

                return (
                  <tr key={p.id}>
                    {/* 1. Project Code */}
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          background: 'rgba(30, 64, 175, 0.08)',
                          padding: '3px 6px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                        title="Double-click to copy Project Code"
                        onDoubleClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(p.projectCode);
                            if (showToast) showToast('Project Code copied to clipboard', 'success');
                          }
                        }}
                      >
                        {p.projectCode}
                      </span>
                    </td>

                    {/* 2. Project Name */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      {p.description && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: 2,
                            maxWidth: 240,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.description}
                        </div>
                      )}
                    </td>

                    {/* 3. Client */}
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {p.client?.name || 'Client'}
                      </span>
                    </td>

                    {/* 4. Candidate Target */}
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        {Number(candidateTarget).toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* 5. Financial Year */}
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {financialYear}
                      </span>
                    </td>

                    {/* 6. Status */}
                    <td>
                      <button
                        onClick={() => handleToggleProjectStatus && handleToggleProjectStatus(p)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Click to toggle status"
                      >
                        <StatusBadge status={p.status} />
                      </button>
                    </td>

                    {/* 7. Action */}
                    <td style={{ textAlign: 'right' }}>
                      <ActionGroup align="right">
                        <ViewAction
                          onClick={() => handleOpenViewProject && handleOpenViewProject(p)}
                          tooltip="View Project Details"
                        />
                        <EditAction
                          onClick={() => handleOpenEditProject && handleOpenEditProject(p)}
                          tooltip="Edit Project Details"
                        />
                      </ActionGroup>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredProjects.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Rows per page:</span>
            <select
              className="form-control"
              value={projectLimit}
              onChange={(e) => {
                setProjectLimit(Number(e.target.value));
                setProjectPage(1);
              }}
              style={{ width: 70, height: 28, fontSize: '0.75rem', padding: '0 8px' }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>
              Page {projectPage} of {totalProjectPages} ({filteredProjects.length} total)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={projectPage <= 1}
              onClick={() => setProjectPage((prev) => Math.max(prev - 1, 1))}
              style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
            >
              Previous
            </button>
            {Array.from({ length: totalProjectPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalProjectPages || Math.abs(p - projectPage) <= 1)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: '0 4px' }}>...</span>}
                  <button
                    className={`btn btn-sm ${p === projectPage ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setProjectPage(p)}
                    style={{ height: 28, minWidth: 28, padding: '0 6px', fontSize: '0.75rem' }}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              className="btn btn-secondary btn-sm"
              disabled={projectPage >= totalProjectPages}
              onClick={() => setProjectPage((prev) => Math.min(prev + 1, totalProjectPages))}
              style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

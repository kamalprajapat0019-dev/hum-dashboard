import React from 'react';
import { Calendar, Users } from 'lucide-react';
import { StatusBadge, ActionGroup, ViewAction, EditAction, Button } from '@/components/common';

export function ExamsTable({
  loading,
  filteredExams = [],
  projects = [],
  exProjectFilter = '',
  setExProjectFilter,
  exStatusFilter = '',
  setExStatusFilter,
  handleOpenManpower,
  handleOpenViewExam,
  handleOpenEditExam,
  handleManageShifts,
}) {
  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 className="card-title">Examinations Management</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Manage specific annual exam drives, testing dates, venue requirements, and candidate allocations
          </p>
        </div>

        {/* Filters: Project and Status ONLY, duplicate button removed */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {/* 1. Project filter */}
          <select
            className="form-control"
            value={exProjectFilter}
            onChange={e => {
              if (setExProjectFilter) setExProjectFilter(e.target.value);
            }}
            style={{ width: 220, fontSize: '0.75rem' }}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectCode} – {p.name}</option>
            ))}
          </select>

          {/* 2. Status filter */}
          <select
            className="form-control"
            value={exStatusFilter}
            onChange={e => {
              if (setExStatusFilter) setExStatusFilter(e.target.value);
            }}
            style={{ width: 140, fontSize: '0.75rem' }}
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Reset filter button */}
          {(exProjectFilter || exStatusFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (setExProjectFilter) setExProjectFilter('');
                if (setExStatusFilter) setExStatusFilter('');
              }}
              style={{ fontSize: '0.75rem' }}
            >
              Reset
            </button>
          )}

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredExams.length}</strong> examinations
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Examination Name</th>
              <th>Parent Project</th>
              <th>Candidate Required Count</th>
              <th>Exam Date &amp; Shifts</th>
              <th>Coverage</th>
              <th>Lifecycle Stage</th>
              <th>Registration Desk</th>
              <th>Buffer Nodes</th>
              <th>Centres Booked</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading examination instances from database...
                </td>
              </tr>
            ) : filteredExams.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No examination instances found. Click &quot;+ New Examination&quot; in the page header to initialize an exam drive.
                </td>
              </tr>
            ) : (
              filteredExams.map(ex => {
                // Parse metadata
                let meta = {};
                if (ex.description) {
                  try {
                    meta = JSON.parse(ex.description);
                    if (typeof meta !== 'object' || meta === null) meta = {};
                  } catch {
                    meta = {};
                  }
                }

                // 1. Dates & Shifts derived from persisted records
                const datesCount = ex.dates?.length || meta.requirementSheet?.datesCount || 0;
                const shiftsCount = ex.dates?.reduce((acc, d) => acc + (d.shifts?.length || 0), 0) || meta.requirementSheet?.shiftsCount || 0;

                // 2. Candidate target
                const candidateTarget =
                  meta.candidateRequiredCount ||
                  meta.summary?.candidateTarget ||
                  meta.requirementSheet?.totalCandidates ||
                  0;

                // 3. Coverage
                const coverage =
                  meta.coverage ||
                  meta.summary?.coverageCount ||
                  meta.requirementSheet?.totalCities ||
                  0;

                // 4. Tolerances
                const regDesk = meta.registrationDesk !== undefined ? `${Number(meta.registrationDesk).toFixed(2)}%` : '5.00%';
                const bufNodes = meta.bufferNodes !== undefined ? `${Number(meta.bufferNodes).toFixed(2)}%` : '3.00%';

                // 5. Centres booked
                const centresBooked = ex.bookings?.length || ex.centresBooked || 0;

                return (
                  <tr key={ex.id}>
                    {/* 1. Examination Name */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ex.examName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {ex.examCode} · {ex.examYear}
                      </div>
                    </td>

                    {/* 2. Parent Project */}
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                        {ex.examType?.project?.name || ex.project?.name || 'Project'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ex.examType?.project?.client?.name || ex.project?.client?.name || 'Client'}
                      </div>
                    </td>

                    {/* 3. Candidate Required Count */}
                    <td>
                      <span style={{ fontWeight: 700, color: candidateTarget > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                        {candidateTarget > 0 ? Number(candidateTarget).toLocaleString() : '—'}
                      </span>
                    </td>

                    {/* 4. Exam Date & Shifts */}
                    <td>
                      <span
                        className={datesCount > 0 ? 'badge badge-purple' : 'badge badge-outline'}
                        style={{ fontSize: '0.75rem', gap: 6, display: 'inline-flex', alignItems: 'center' }}
                        title={
                          ex.dates?.length > 0
                            ? ex.dates.map(d => `${d.examDate.substring(0, 10)}: ${(d.shifts || []).map(s => s.shiftName).join(', ')}`).join('\n')
                            : 'No dates detected yet'
                        }
                      >
                        <Calendar size={13} />
                        <span>{datesCount} Dates · {shiftsCount} Shifts</span>
                      </span>
                    </td>

                    {/* 5. Coverage */}
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {coverage > 0 ? `${coverage} Cities` : '—'}
                      </span>
                    </td>

                    {/* 6. Lifecycle Stage */}
                    <td>
                      <StatusBadge status={ex.status} />
                    </td>

                    {/* 7. Registration Desk */}
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {regDesk}
                      </span>
                    </td>

                    {/* 8. Buffer Nodes */}
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {bufNodes}
                      </span>
                    </td>

                    {/* 9. Centres Booked */}
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                        {centresBooked} Booked
                      </span>
                    </td>

                    {/* 10. Actions (Manage Shifts, Manpower, View, Edit) */}
                    <td style={{ textAlign: 'right' }}>
                      <ActionGroup align="right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Calendar size={12} />}
                          onClick={() => handleManageShifts && handleManageShifts(ex)}
                          title="Manage Shifts"
                        >
                          Manage Shifts
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Users size={12} />}
                          onClick={() => handleOpenManpower && handleOpenManpower(ex)}
                          title="Manpower configuration"
                        >
                          Manpower
                        </Button>
                        <ViewAction
                          onClick={() => handleOpenViewExam && handleOpenViewExam(ex)}
                          tooltip="View Examination Requirements &amp; Workbook"
                        />
                        <EditAction
                          onClick={() => handleOpenEditExam && handleOpenEditExam(ex)}
                          tooltip="Edit Examination &amp; Requirements"
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
    </div>
  );
}

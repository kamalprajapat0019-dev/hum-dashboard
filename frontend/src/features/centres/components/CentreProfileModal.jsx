import { useState } from 'react';
import {
  X, CheckCircle, AlertTriangle, ShieldCheck, FileText, Building2,
  Zap, Lock, CreditCard, History, UserCheck, Eye, EyeOff, Check,
  Clock, Download, RefreshCw, AlertCircle, Ban, Send, Calendar,
  MapPin, Phone, Mail, Award, CheckCircle2, Edit, Save
} from 'lucide-react';
import { StatusBadge } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';

export default function CentreProfileModal({
  centre,
  onClose,
  onRefresh,
  currentUserRole = 'ADMIN',
  initialEditMode = false,
}) {
  const [activeTab, setActiveTab] = useState('basic'); // basic | personnel | docs | building | power | safety | bank | history
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    centreName: centre?.centreName || '',
    centreCategory: centre?.centreCategory || 'College',
    centreAddress: centre?.centreAddress || '',
    stateName: centre?.stateName || '',
    cityName: centre?.cityName || '',
    pincode: centre?.pincode || '',
    organizationType: centre?.organizationType || 'Trust',
  });

  // Modals for admin actions
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [showAuditorModal, setShowAuditorModal] = useState(false);
  const [selectedAuditorId, setSelectedAuditorId] = useState('');
  const [auditDate, setAuditDate] = useState('');
  const [auditRemarks, setAuditRemarks] = useState('');

  const [showDocActionModal, setShowDocActionModal] = useState(null); // { doc, action: 'verify' | 'reject' }
  const [docRemarks, setDocRemarks] = useState('');
  const [docRejectionReason, setDocRejectionReason] = useState('');

  const [showBankActionModal, setShowBankActionModal] = useState(null); // 'verify' | 'reject'
  const [bankRemarks, setBankRemarks] = useState('');
  const [bankRejectionReason, setBankRejectionReason] = useState('');

  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  if (!centre) return null;

  const inf = centre.infrastructure || {};
  const bank = centre.bankAccount || {};
  const contacts = centre.contacts || [];
  const docs = centre.documents || [];
  const capacity = centre.capacity || {};
  const history = centre.activityHistory || [];

  const owner = contacts.find((c) => c.personType === 'Owner') || {};
  const cs = contacts.find((c) => c.personType === 'Centre CS' || c.personType === 'TCA') || {};
  const it = contacts.find((c) => c.personType === 'IT Person') || {};
  const electrician = contacts.find((c) => c.personType === 'Electrician') || {};

  // Handle Application Approval
  const handleApprove = async () => {
    setLoadingAction(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.APPROVE_CENTRE(centre.id), {
        remarks: approveRemarks,
      });
      showNotification('Centre application approved successfully. Status is now Ready to Book.');
      setShowApproveModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      showNotification(err.message || 'Failed to approve application', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Application Rejection
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showNotification('Rejection reason is mandatory.', 'error');
      return;
    }
    setLoadingAction(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.REJECT_CENTRE(centre.id), {
        reason: rejectReason,
      });
      showNotification('Centre application rejected.', 'success');
      setShowRejectModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      showNotification(err.message || 'Failed to reject application', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Auditor Assignment
  const handleAssignAuditor = async () => {
    if (!selectedAuditorId) {
      showNotification('Please select an auditor.', 'error');
      return;
    }
    setLoadingAction(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.ASSIGN_AUDITOR(centre.id), {
        auditorId: selectedAuditorId,
        auditDate,
        remarks: auditRemarks,
      });
      showNotification('Auditor assigned successfully.');
      setShowAuditorModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      showNotification(err.message || 'Failed to assign auditor', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Document Verification / Rejection
  const handleDocAction = async () => {
    if (showDocActionModal.action === 'reject' && !docRejectionReason.trim()) {
      showNotification('Rejection reason is mandatory.', 'error');
      return;
    }
    setLoadingAction(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.VERIFY_DOC(centre.id), {
        documentId: showDocActionModal.doc.id,
        status: showDocActionModal.action === 'verify' ? 'Verified' : 'Rejected',
        remarks: docRemarks,
        rejectionReason: docRejectionReason,
      });
      showNotification(`Document ${showDocActionModal.action === 'verify' ? 'verified' : 'rejected'} successfully.`);
      setShowDocActionModal(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      showNotification(err.message || 'Document verification update failed', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Bank Verification / Rejection
  const handleBankAction = async () => {
    if (showBankActionModal === 'reject' && !bankRejectionReason.trim()) {
      showNotification('Rejection reason is mandatory.', 'error');
      return;
    }
    setLoadingAction(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.VERIFY_BANK(centre.id), {
        status: showBankActionModal === 'verify' ? 'Verified' : 'Rejected',
        remarks: bankRemarks,
        rejectionReason: bankRejectionReason,
      });
      showNotification(`Bank account ${showBankActionModal === 'verify' ? 'verified and approved' : 'rejected'}.`);
      setShowBankActionModal(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      showNotification(err.message || 'Bank verification update failed', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Save Centre Edits (Admin / Operations)
  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      await apiClient.put(ENDPOINTS.ADMIN.CENTRE_DETAIL(centre.id), {
        centreName: editForm.centreName,
        centreCategory: editForm.centreCategory,
        centreAddress: editForm.centreAddress,
        stateName: editForm.stateName,
        cityName: editForm.cityName,
        pincode: editForm.pincode,
        organizationType: editForm.organizationType,
      });
      showNotification('Centre details updated successfully.', 'success');
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      showNotification(err.message || 'Failed to update centre details', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const tabs = [
    { id: 'basic', label: '1. Basic Information', icon: Building2 },
    { id: 'personnel', label: '2. Personnel', icon: UserCheck },
    { id: 'docs', label: `3. Documents (${docs.length})`, icon: FileText },
    { id: 'building', label: '4. Facilities', icon: Building2 },
    { id: 'power', label: '5. Power & Network', icon: Zap },
    { id: 'safety', label: '6. Safety & Security', icon: ShieldCheck },
    { id: 'bank', label: '7. Bank Details', icon: CreditCard },
    { id: 'history', label: '8. Activity History', icon: History },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal modal-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1080px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'var(--color-bg-card, #ffffff)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg-subtle, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#eff6ff',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                  {centre.centreName}
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#f1f5f9',
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  {centre.centreCode}
                </span>
                <StatusBadge status={centre.centreStatus} />
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginTop: 3 }}>
                {centre.cityName ? `${centre.cityName}, ${centre.stateName || ''}` : 'Location unassigned'} • Declared Capacity: <strong>{capacity.examNodes || centre.totalNodes || 0} nodes</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Quick Admin Actions */}
            {(currentUserRole === 'ADMIN' || currentUserRole === 'OPERATIONS') && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  if (!isEditing) setActiveTab('basic');
                  setIsEditing(!isEditing);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: isEditing ? '#dc2626' : '#2563eb' }}
                title="Edit Centre Details"
              >
                {isEditing ? <X size={14} /> : <Edit size={14} />} {isEditing ? 'Cancel Edit' : 'Edit Details'}
              </button>
            )}

            {centre.centreStatus !== 'Ready to Book' && centre.centreStatus !== 'Approved' && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setShowApproveModal(true)}
                style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={14} /> Approve Application
              </button>
            )}

            {centre.centreStatus !== 'Rejected' && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowRejectModal(true)}
                style={{ borderColor: '#fca5a5', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <AlertTriangle size={14} /> Reject
              </button>
            )}

            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowAuditorModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UserCheck size={14} /> Assign Auditor
            </button>

            <button
              className="btn-ghost"
              onClick={onClose}
              style={{ padding: 6, borderRadius: 6, color: '#64748b', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div
            style={{
              padding: '10px 24px',
              background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: toast.type === 'error' ? '#991b1b' : '#166534',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            }}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {toast.message}
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--color-bg-card, #ffffff)',
            padding: '0 24px',
            overflowX: 'auto',
            gap: 6,
          }}
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 16px',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#1e40af' : '#64748b',
                  borderBottom: isSelected ? '2px solid #1e40af' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* 1. Basic Information Tab - Edit Mode */}
          {activeTab === 'basic' && isEditing && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e40af' }}>
                  Edit Centre Information (Authorized Admin / Operations)
                </h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Save size={14} /> {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Centre Name (As per Document)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.centreName}
                    onChange={(e) => setEditForm({ ...editForm, centreName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Centre Category</label>
                  <select
                    className="form-control"
                    value={editForm.centreCategory}
                    onChange={(e) => setEditForm({ ...editForm, centreCategory: e.target.value })}
                  >
                    {['College', 'School', 'University', 'Government Institution', 'Private Educational Institution', 'Dedicated Examination Centre', 'Other'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Organization Type</label>
                  <select
                    className="form-control"
                    value={editForm.organizationType}
                    onChange={(e) => setEditForm({ ...editForm, organizationType: e.target.value })}
                  >
                    {['Trust', 'Society', 'Partnership', 'Company', 'Individual', 'Other'].map((org) => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.stateName}
                    onChange={(e) => setEditForm({ ...editForm, stateName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.cityName}
                    onChange={(e) => setEditForm({ ...editForm, cityName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>PIN Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.pincode}
                    maxLength={6}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Full Centre Address</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={editForm.centreAddress}
                    onChange={(e) => setEditForm({ ...editForm, centreAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 1. Basic Information Tab - View Mode */}
          {activeTab === 'basic' && !isEditing && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Venue Identification & Location
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Category:</span> <strong>{centre.centreCategory || 'Educational Institution'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Region:</span> <strong>{centre.regionId || 'North'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Full Address:</span> <div>{centre.centreAddress}</div></div>
                  <div><span style={{ color: '#64748b' }}>Jurisdiction:</span> <strong>{centre.cityName}, {centre.stateName} (PIN: {centre.pincode})</strong></div>
                  {centre.taluka && <div><span style={{ color: '#64748b' }}>Taluka:</span> <strong>{centre.taluka}</strong></div>}
                  <div><span style={{ color: '#64748b' }}>Edu Code:</span> {centre.eduCode || '—'}</div>
                  <div><span style={{ color: '#64748b' }}>TC Code:</span> {centre.tcCode || '—'}</div>
                  <div><span style={{ color: '#64748b' }}>Venue Classification:</span> {centre.venueStatus}</div>
                  <div><span style={{ color: '#64748b' }}>Organization Entity:</span> {centre.organizationType}</div>
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Capacity & Prior Experience
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Declared Total Nodes:</span> <strong style={{ fontSize: '1.05rem', color: '#1e40af' }}>{capacity.examNodes || centre.totalNodes || 0} nodes</strong></div>
                  <div><span style={{ color: '#64748b' }}>Buffer Percentage:</span> {capacity.bufferPercent || 10}%</div>
                  <div><span style={{ color: '#64748b' }}>Registration Desks:</span> {capacity.regDeskCount || 2}</div>
                  <div><span style={{ color: '#64748b' }}>Server Units:</span> {capacity.serverCount || 1}</div>
                  <div><span style={{ color: '#64748b' }}>Previous CBT Exam Conducted?</span> <strong>{centre.previousExamConducted ? 'Yes' : 'No'}</strong></div>
                  {centre.previousEduExam && (
                    <div><span style={{ color: '#64748b' }}>Prior Exam Details:</span> <div>{centre.previousEduExam}</div></div>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Official Contact & Transit
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Official Email:</span> {centre.officialEmail || '—'}</div>
                  <div><span style={{ color: '#64748b' }}>Official Mobile:</span> {centre.officialMobile || '—'}</div>
                  <div><span style={{ color: '#64748b' }}>Alternate Mobile:</span> {centre.alternateMobile || '—'}</div>
                  <div><span style={{ color: '#64748b' }}>Landline with STD:</span> {centre.phoneStd || '—'}</div>
                  <div><span style={{ color: '#64748b' }}>Nearby Bus Stand:</span> {inf.busStandNearby ? `Yes (${inf.busStandName || 'Nearby'})` : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Nearby Metro Station:</span> {inf.metroNearby ? `Yes (${inf.metroStationName || 'Nearby'})` : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Distance from Highway:</span> {inf.distanceFromMainRoad !== null ? `${inf.distanceFromMainRoad} km` : '—'}</div>
                  <div><span style={{ color: '#64748b' }}>PH Friendly Centre:</span> {inf.phFriendly ? `Yes (${inf.phCandidateCount || 0} candidates)` : 'No'}</div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Key Personnel Tab */}
          {activeTab === 'personnel' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                { title: 'Centre Owner / Authorized Head', data: owner, roleBadge: 'Owner' },
                { title: 'Centre Superintendent (CS / TCA)', data: cs, roleBadge: 'Centre Head' },
                { title: 'Centre IT Person / Technical Lead', data: it, roleBadge: 'IT Lead' },
                { title: 'Dedicated Electrician', data: electrician, roleBadge: 'Electrician' },
              ].map((p, idx) => (
                <div key={idx} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{p.title}</h4>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', fontWeight: 600 }}>
                      {p.roleBadge}
                    </span>
                  </div>
                  {p.data.fullName ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                      <div><span style={{ color: '#64748b' }}>Name:</span> <strong>{p.data.fullName}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Mobile:</span> {p.data.contactNumber}</div>
                      {p.data.email && <div><span style={{ color: '#64748b' }}>Email:</span> {p.data.email}</div>}
                      {p.data.aadhaarNumber && (
                        <div>
                          <span style={{ color: '#64748b' }}>Aadhaar:</span>{' '}
                          <code style={{ background: '#f8fafc', padding: '1px 6px', borderRadius: 4 }}>
                            {p.data.aadhaarNumber.length > 4 ? `XXXX-XXXX-${p.data.aadhaarNumber.slice(-4)}` : p.data.aadhaarNumber}
                          </code>
                        </div>
                      )}
                      {p.data.fatherName && <div><span style={{ color: '#64748b' }}>Father's Name:</span> {p.data.fatherName}</div>}
                      {p.data.permanentAddress && <div><span style={{ color: '#64748b' }}>Address:</span> {p.data.permanentAddress}</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: '#94a3b8', padding: '12px 0' }}>
                      No personnel record submitted for this role.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 3. Document Management Tab */}
          {activeTab === 'docs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Submitted Supporting Documents</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                    Review, download, verify or reject uploaded certificates and agreements.
                  </p>
                </div>
              </div>

              {docs.length === 0 ? (
                <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  No documents have been uploaded for this centre application yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>S. No.</th>
                        <th>Document Name</th>
                        <th>Document Type</th>
                        <th>Version</th>
                        <th>Uploaded On</th>
                        <th>Verification Status</th>
                        <th>Admin Remarks</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((doc, idx) => (
                        <tr key={doc.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{doc.documentName || doc.documentType}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.fileName}</div>
                          </td>
                          <td><span className="badge badge-subtle">{doc.documentType}</span></td>
                          <td>v{doc.version}</td>
                          <td>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}</td>
                          <td>
                            {doc.status === 'Verified' && <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Verified</span>}
                            {doc.status === 'Pending' && <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Pending</span>}
                            {doc.status === 'Rejected' && <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={12} /> Rejected</span>}
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: doc.status === 'Rejected' ? '#dc2626' : '#64748b' }}>
                            {doc.rejectionReason || doc.remarks || '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              {doc.fileUrl && (
                                <button
                                  className="btn btn-xs btn-secondary"
                                  onClick={() => setPreviewDocUrl(doc.fileUrl)}
                                  title="Preview Document"
                                >
                                  <Eye size={12} />
                                </button>
                              )}

                              {doc.status !== 'Verified' && (
                                <button
                                  className="btn btn-xs btn-primary"
                                  onClick={() => {
                                    setShowDocActionModal({ doc, action: 'verify' });
                                    setDocRemarks('');
                                    setDocRejectionReason('');
                                  }}
                                  style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                                  title="Verify Document"
                                >
                                  <Check size={12} /> Verify
                                </button>
                              )}

                              {doc.status !== 'Rejected' && (
                                <button
                                  className="btn btn-xs btn-secondary"
                                  onClick={() => {
                                    setShowDocActionModal({ doc, action: 'reject' });
                                    setDocRemarks('');
                                    setDocRejectionReason('');
                                  }}
                                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                  title="Reject Document"
                                >
                                  <X size={12} /> Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. Facilities Tab */}
          {activeTab === 'building' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Building & Layout
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Number of Floors:</span> <strong>{inf.noOfFloors || 1}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Building Structure:</span> {inf.buildingType || 'Independent Building'}</div>
                  <div><span style={{ color: '#64748b' }}>Passenger Lifts:</span> {inf.noOfLifts || 0}</div>
                  <div><span style={{ color: '#64748b' }}>Entry Gates:</span> {inf.noOfEntryGates || 1}</div>
                  <div><span style={{ color: '#64748b' }}>Exit Gates:</span> {inf.noOfExitGates || 1}</div>
                  <div><span style={{ color: '#64748b' }}>Separate Entry/Exit:</span> {inf.separateEntryExit ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Building Wing / Details:</span> {inf.buildingNameWing || 'Main Wing'}</div>
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Sanitation & CCTV Surveillance
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Washrooms on Each Floor:</span> {inf.washroomsEachFloor || 1}</div>
                  <div><span style={{ color: '#64748b' }}>Male Washrooms (per floor):</span> {inf.maleWashroomsEachFloor || 1}</div>
                  <div><span style={{ color: '#64748b' }}>Female Washrooms (per floor):</span> {inf.femaleWashroomsEachFloor || 1}</div>
                  <div><span style={{ color: '#64748b' }}>Active CCTV Cameras:</span> <strong>{inf.noOfCctvCameras || 0} units</strong></div>
                  <div><span style={{ color: '#64748b' }}>CCTV Lobby Coverage:</span> {inf.cctvLobby ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Drinking Water Area:</span> {inf.drinkingWater ? 'Available' : 'Not verified'}</div>
                  <div><span style={{ color: '#64748b' }}>AC in Examination Labs:</span> {inf.acAvailable ? 'Available' : 'No'}</div>
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Server Room Infrastructure
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Dedicated Server Room:</span> {inf.serverRoomAvailable ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>AC in Server Room:</span> {inf.acInServerRoom ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>UPS / Power Points:</span> {inf.serverRoomUpsNetwork ? 'Available' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Access-Controlled Room:</span> {inf.dedicatedServerRoom ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Locker / Baggage Facility:</span> {inf.lockerFacility ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Reception & Waiting Area:</span> {inf.receptionArea ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Power & Network Tab */}
          {activeTab === 'power' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Power Backup Resilience
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Online UPS Available?</span> <strong>{inf.upsAvailable ? 'Yes' : 'No'}</strong></div>
                  {inf.upsAvailable && <div><span style={{ color: '#64748b' }}>UPS Capacity:</span> <strong>{inf.upsCapacityKva || 0} KVA</strong></div>}
                  <div><span style={{ color: '#64748b' }}>Primary GENSET:</span> <strong>{inf.gensetAvailable ? `Yes (${inf.gensetCapacityKva || 0} KVA)` : 'No'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Backup Secondary GENSET:</span> <strong>{inf.backupGensetAvailable ? `Yes (${inf.backupGensetCapacityKva || 0} KVA)` : 'No'}</strong></div>
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Network Connectivity & LAN
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>1 GBPS Core Switch:</span> <strong>{inf.coreSwitch1Gbps ? 'Available' : 'No'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Primary Internet Line:</span> <strong>{inf.primaryInternet ? 'Active' : 'No'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Secondary Backup ISP:</span> <strong>{inf.backupInternet ? 'Active' : 'No'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>IP Scanning Compatible:</span> <strong>{inf.ipScanningAvailable ? 'Yes' : 'No'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Network Topology Diagram:</span> {inf.networkDiagramAvailable ? 'Available' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>LAN Architecture:</span> {inf.lanType || 'Single LAN'}</div>
                </div>
              </div>
            </div>
          )}

          {/* 6. Safety & Security Tab */}
          {activeTab === 'safety' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Fire Safety & Evacuation
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Fire Extinguishers:</span> <strong>{inf.noOfFireExtinguishers || 0} units</strong></div>
                  <div><span style={{ color: '#64748b' }}>Extinguisher on Each Floor:</span> {inf.fireExtinguisherEachFloor ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Fire Emergency Access:</span> {inf.fireEmergencyAccessible ? 'Clear' : 'Blocked'}</div>
                  <div><span style={{ color: '#64748b' }}>Designated Assembly Area:</span> {inf.assemblyArea ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Emergency Safety Signage:</span> {inf.safetySignage ? 'Installed' : 'Missing'}</div>
                  <div><span style={{ color: '#64748b' }}>First Aid Kits:</span> {inf.firstAidKit ? 'Available' : 'No'}</div>
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600, color: '#1e40af' }}>
                  Premises Security & Hygiene
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b' }}>Safe Neighborhood:</span> {inf.safeArea ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Safe During Early/Late Hours:</span> {inf.safeLateHours ? 'Yes' : 'No'}</div>
                  <div><span style={{ color: '#64748b' }}>Adequate Hygiene & Cleanliness:</span> {inf.adequateHygiene ? 'Compliant' : 'Non-compliant'}</div>
                  <div><span style={{ color: '#64748b' }}>Third-Party Risk Insurance:</span> {inf.insuranceCoverage ? 'Covered' : 'Not insured'}</div>
                </div>
              </div>
            </div>
          )}

          {/* 7. Bank Details Tab */}
          {activeTab === 'bank' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Beneficiary Bank Account Details</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                    Secured financial profile for commercial clearance and payment disbursements.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {bank.verificationStatus !== 'Verified' && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setShowBankActionModal('verify')}
                      style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                    >
                      <Check size={14} /> Verify Bank Account
                    </button>
                  )}
                  {bank.verificationStatus !== 'Rejected' && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setShowBankActionModal('reject')}
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      <X size={14} /> Reject Bank Details
                    </button>
                  )}
                </div>
              </div>

              {!bank.accountNumber ? (
                <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  No bank account details have been submitted for this centre.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Account Details</span>
                      <span className={`badge ${bank.verificationStatus === 'Verified' ? 'badge-success' : bank.verificationStatus === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {bank.verificationStatus || 'Submitted'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Beneficiary / Account Name</div>
                        <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: 2 }}>{bank.accountName}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Bank & Branch</div>
                        <div style={{ fontWeight: 600, marginTop: 2 }}>{bank.bankName} — {bank.branchName}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Account Number</span>
                          <button
                            type="button"
                            onClick={() => setShowFullAccount(!showFullAccount)}
                            style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            {showFullAccount ? <EyeOff size={12} /> : <Eye size={12} />}
                            {showFullAccount ? 'Mask' : 'Show full'}
                          </button>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.05em', marginTop: 2 }}>
                          {showFullAccount ? (bank.accountNumber || '—') : (bank.accountNumber?.length > 4 ? `XXXX XXXX ${bank.accountNumber.slice(-4)}` : bank.accountNumber)}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>IFSC Code</div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>{bank.ifscCode}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Account Type</div>
                          <div style={{ fontWeight: 600, marginTop: 2 }}>{bank.accountType}</div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Payment Clearance Status</div>
                        <div style={{ fontWeight: 600, color: bank.isPaymentEligible ? '#16a34a' : '#d97706', marginTop: 2 }}>
                          {bank.isPaymentEligible ? 'Payment Eligible' : 'Awaiting Full Verification'}
                        </div>
                      </div>

                      {bank.rejectionReason && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 6, color: '#991b1b', fontSize: '0.8125rem' }}>
                          <strong>Rejection Reason:</strong> {bank.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supporting Bank Proof Previews */}
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600 }}>Supporting Bank Proofs</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {bank.cancelledChequeUrl && (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileText size={20} color="#1e40af" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Cancelled Cheque Copy</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded bank proof</div>
                            </div>
                          </div>
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => setPreviewDocUrl(bank.cancelledChequeUrl)}
                          >
                            <Eye size={12} /> View
                          </button>
                        </div>
                      )}

                      {bank.passbookUrl && (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileText size={20} color="#1e40af" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Bank Passbook (Front Page)</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded bank proof</div>
                            </div>
                          </div>
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => setPreviewDocUrl(bank.passbookUrl)}
                          >
                            <Eye size={12} /> View
                          </button>
                        </div>
                      )}

                      {!bank.cancelledChequeUrl && !bank.passbookUrl && (
                        <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No cheque or passbook file attached directly to bank record. Check Documents tab for uploaded proofs.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. Activity History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 700 }}>Centre Audit & Activity Trail</h3>
              {history.length === 0 ? (
                <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  No recent audit history recorded for this centre.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {history.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{log.action}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 2 }}>
                          by <strong>{log.user?.name || log.userEmail || 'System'}</strong> ({log.user?.role || 'SYSTEM'})
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            background: 'var(--color-bg-subtle, #f8fafc)',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>
            Close Profile
          </button>
        </div>
      </div>

      {/* ── Dialog Modals for Admin Actions ── */}

      {/* Approve Application Modal */}
      {showApproveModal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setShowApproveModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Approve Centre Application</h3>
              <button className="btn-ghost" onClick={() => setShowApproveModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Are you sure you want to approve <strong>{centre.centreName}</strong>? This will transition the centre status to <strong>Ready to Book</strong>.
              </p>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Approval Remarks (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  placeholder="e.g. Infrastructure verified and documents validated."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowApproveModal(false)} disabled={loadingAction}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApprove} disabled={loadingAction} style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}>
                {loadingAction ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Application Modal */}
      {showRejectModal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setShowRejectModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626' }}>Reject Centre Application</h3>
              <button className="btn-ghost" onClick={() => setShowRejectModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                A mandatory rejection reason is required and will be communicated to the Centre User for correction.
              </p>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label" style={{ color: '#991b1b', fontWeight: 600 }}>Rejection Reason *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify why this application is rejected..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={loadingAction}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReject} disabled={loadingAction} style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}>
                {loadingAction ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Auditor Modal */}
      {showAuditorModal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setShowAuditorModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Verification Auditor</h3>
              <button className="btn-ghost" onClick={() => setShowAuditorModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Auditor ID or Email *</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedAuditorId}
                  onChange={(e) => setSelectedAuditorId(e.target.value)}
                  placeholder="Enter Auditor User ID (e.g. auditor user id)"
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Scheduled Audit Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Audit Instructions</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={auditRemarks}
                  onChange={(e) => setAuditRemarks(e.target.value)}
                  placeholder="e.g. Verify server room CCTV and power backup generator."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAuditorModal(false)} disabled={loadingAction}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignAuditor} disabled={loadingAction}>
                {loadingAction ? 'Assigning...' : 'Assign Auditor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Action Modal */}
      {showDocActionModal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setShowDocActionModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {showDocActionModal.action === 'verify' ? 'Verify Document' : 'Reject Document'}
              </h3>
              <button className="btn-ghost" onClick={() => setShowDocActionModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12, fontSize: '0.875rem' }}>
                Document: <strong>{showDocActionModal.doc.documentName || showDocActionModal.doc.documentType}</strong>
              </div>
              {showDocActionModal.action === 'reject' ? (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#991b1b', fontWeight: 600 }}>Rejection Reason *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={docRejectionReason}
                    onChange={(e) => setDocRejectionReason(e.target.value)}
                    placeholder="Specify why document is rejected (e.g. blurred, expired)..."
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Verification Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={docRemarks}
                    onChange={(e) => setDocRemarks(e.target.value)}
                    placeholder="e.g. Validated against official database."
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDocActionModal(null)} disabled={loadingAction}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleDocAction}
                disabled={loadingAction}
                style={{
                  background: showDocActionModal.action === 'verify' ? '#16a34a' : '#dc2626',
                  borderColor: showDocActionModal.action === 'verify' ? '#16a34a' : '#dc2626',
                  color: '#fff',
                }}
              >
                {loadingAction ? 'Processing...' : showDocActionModal.action === 'verify' ? 'Mark Verified' : 'Reject Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Action Modal */}
      {showBankActionModal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setShowBankActionModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {showBankActionModal === 'verify' ? 'Approve & Verify Bank Details' : 'Reject Bank Details'}
              </h3>
              <button className="btn-ghost" onClick={() => setShowBankActionModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {showBankActionModal === 'reject' ? (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#991b1b', fontWeight: 600 }}>Rejection Reason *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={bankRejectionReason}
                    onChange={(e) => setBankRejectionReason(e.target.value)}
                    placeholder="Specify reason (e.g. beneficiary name mismatch, invalid IFSC)..."
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Verifying this bank account will enable this centre for commercial settlement and payment disbursements.
                  </p>
                  <label className="form-label" style={{ marginTop: 10 }}>Approval Remarks (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={bankRemarks}
                    onChange={(e) => setBankRemarks(e.target.value)}
                    placeholder="e.g. Account name matches registered centre name."
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBankActionModal(null)} disabled={loadingAction}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleBankAction}
                disabled={loadingAction}
                style={{
                  background: showBankActionModal === 'verify' ? '#16a34a' : '#dc2626',
                  borderColor: showBankActionModal === 'verify' ? '#16a34a' : '#dc2626',
                  color: '#fff',
                }}
              >
                {loadingAction ? 'Saving...' : showBankActionModal === 'verify' ? 'Approve Bank' : 'Reject Bank'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Full Preview Modal */}
      {previewDocUrl && (
        <div className="modal-backdrop" style={{ zIndex: 1300 }} onClick={() => setPreviewDocUrl(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title">Document Preview</h3>
              <button className="btn-ghost" onClick={() => setPreviewDocUrl(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
              {previewDocUrl.startsWith('data:image/') || previewDocUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                <img src={previewDocUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <iframe src={previewDocUrl} title="Document Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
              )}
            </div>
            <div className="modal-footer">
              <a href={previewDocUrl} download="document" className="btn btn-sm btn-secondary" target="_blank" rel="noreferrer">
                <Download size={14} /> Open in New Tab
              </a>
              <button className="btn btn-sm btn-primary" onClick={() => setPreviewDocUrl(null)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { useState } from 'react';
import {
  X, CheckCircle, AlertTriangle, FileText, Building2,
  Zap, Lock, CreditCard, History, UserCheck, Check,
  AlertCircle, Send, Edit
} from 'lucide-react';
import { StatusBadge } from '@/components/common';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import {
  BasicTab,
  PersonnelTab,
  DocsTab,
  BuildingTab,
  PowerTab,
  SafetyTab,
  BankTab,
  HistoryTab,
} from './profile-tabs';
import {
  ApproveModal,
  RejectModal,
  AuditorModal,
  DocActionModal,
  BankActionModal,
  InviteModal,
  DocPreviewModal,
} from './profile-dialogs';

export default function CentreProfileModal({
  centre,
  onClose,
  onRefresh,
  currentUserRole = 'ADMIN',
  initialEditMode = false,
}) {
  const roleUpper = (currentUserRole || 'ADMIN').toUpperCase();
  const isPrivileged = roleUpper === 'ADMIN' || roleUpper === 'OPERATIONS' || currentUserRole === 'admin' || currentUserRole === 'operations_executive';

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

  // Centre User Invitation Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [inviteResult, setInviteResult] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(false);

  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenInvite = (contact) => {
    setInviteForm({
      name: contact?.fullName || '',
      email: contact?.email || '',
      phone: contact?.contactNumber || '',
      notes: '',
    });
    setInviteResult(null);
    setCopiedInviteUrl(false);
    setShowInviteModal(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      showNotification('Contact Name and Email are required.', 'error');
      return;
    }
    setInviting(true);
    try {
      const endpoint = (roleUpper === 'ADMIN' || currentUserRole === 'admin') ? ENDPOINTS.ADMIN.USER_INVITE : ENDPOINTS.CENTRE_PORTAL.INVITE_USER;
      const res = await apiClient.post(endpoint, {
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        phone: inviteForm.phone.trim() || undefined,
        centreId: centre.id,
        clientId: centre.clientId,
        role: 'CENTRE',
        scope: { centres: [centre.id], projects: [], clients: [centre.clientId].filter(Boolean) },
      });
      if (res && res.success && res.data) {
        setInviteResult(res.data);
        showNotification(`Invitation generated successfully for ${inviteForm.email}!`);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to send invitation', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteResult?.registrationUrl) {
      navigator.clipboard.writeText(inviteResult.registrationUrl);
      setCopiedInviteUrl(true);
      showNotification('Invitation link copied to clipboard!');
      setTimeout(() => setCopiedInviteUrl(false), 3000);
    }
  };

  if (!centre) return null;

  const inf = centre.infrastructure || {};
  const bank = centre.bankAccount || {};
  const contacts = centre.contacts || [];
  const docs = centre.documents || [];
  const capacity = centre.capacity || {};
  const history = centre.activityHistory || [];

  // Categorize personnel contacts
  const owner = contacts.find((c) => c.personType === 'Owner') || {};
  const cs = contacts.find((c) => c.personType === 'Centre Head / Venue CS' || c.personType === 'TCA') || {};
  const it = contacts.find((c) => c.personType === 'IT Person') || {};
  const electrician = contacts.find((c) => c.personType === 'Electrician') || {};

  // Handlers for Admin Operations
  const handleApprove = async () => {
    try {
      setLoadingAction(true);
      await apiClient.post(ENDPOINTS.ADMIN.CENTRE_APPROVE(centre.id), { remarks: approveRemarks });
      showNotification('Centre Application Approved successfully!');
      setShowApproveModal(false);
      onRefresh?.();
    } catch (err) {
      showNotification(err.message || 'Failed to approve application', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showNotification('Rejection reason is mandatory.', 'error');
      return;
    }
    try {
      setLoadingAction(true);
      await apiClient.post(ENDPOINTS.ADMIN.CENTRE_REJECT(centre.id), { reason: rejectReason.trim() });
      showNotification('Centre Application has been rejected.', 'success');
      setShowRejectModal(false);
      onRefresh?.();
    } catch (err) {
      showNotification(err.message || 'Failed to reject application', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAssignAuditor = async () => {
    if (!selectedAuditorId.trim()) {
      showNotification('Auditor ID is required.', 'error');
      return;
    }
    try {
      setLoadingAction(true);
      await apiClient.post(ENDPOINTS.ADMIN.CENTRE_ASSIGN_AUDITOR(centre.id), {
        auditorId: selectedAuditorId.trim(),
        auditDate: auditDate ? new Date(auditDate).toISOString() : undefined,
        remarks: auditRemarks || undefined,
      });
      showNotification('Verification Auditor assigned successfully!');
      setShowAuditorModal(false);
      onRefresh?.();
    } catch (err) {
      showNotification(err.message || 'Failed to assign auditor', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDocAction = async () => {
    if (!showDocActionModal) return;
    const { doc, action } = showDocActionModal;
    if (action === 'reject' && !docRejectionReason.trim()) {
      showNotification('Rejection reason is mandatory when rejecting a document.', 'error');
      return;
    }

    try {
      setLoadingAction(true);
      await apiClient.post(ENDPOINTS.ADMIN.CENTRE_VERIFY_DOC(centre.id), {
        documentId: doc.id,
        status: action === 'verify' ? 'Verified' : 'Rejected',
        remarks: docRemarks.trim() || undefined,
        rejectionReason: action === 'reject' ? docRejectionReason.trim() : undefined,
      });
      showNotification(`Document ${action === 'verify' ? 'verified' : 'rejected'} successfully!`);
      setShowDocActionModal(null);
      onRefresh?.();
    } catch (err) {
      showNotification(err.message || 'Failed to update document status', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBankAction = async () => {
    if (!showBankActionModal) return;
    const isReject = (typeof showBankActionModal === 'object' && showBankActionModal.action === 'reject') || showBankActionModal === 'reject';
    if (isReject && !bankRejectionReason.trim()) {
      showNotification('Rejection reason is mandatory when rejecting bank details.', 'error');
      return;
    }

    try {
      setLoadingAction(true);
      await apiClient.post(ENDPOINTS.ADMIN.CENTRE_VERIFY_BANK(centre.id), {
        status: !isReject ? 'Verified' : 'Rejected',
        remarks: bankRemarks.trim() || undefined,
        rejectionReason: isReject ? bankRejectionReason.trim() : undefined,
      });
      showNotification(`Bank details ${!isReject ? 'approved & verified' : 'rejected'} successfully!`);
      setShowBankActionModal(null);
      onRefresh?.();
    } catch (err) {
      showNotification(err.message || 'Failed to update bank status', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.centreName.trim()) {
      showNotification('Centre Name is required.', 'error');
      return;
    }
    try {
      setSavingEdit(true);
      await apiClient.put(ENDPOINTS.ADMIN.CENTRE_DETAIL(centre.id), {
        centreName: editForm.centreName.trim(),
        centreCategory: editForm.centreCategory,
        centreAddress: editForm.centreAddress.trim(),
        stateName: editForm.stateName.trim(),
        cityName: editForm.cityName.trim(),
        pincode: editForm.pincode.trim(),
        organizationType: editForm.organizationType,
      });
      showNotification('Centre details updated successfully!');
      setIsEditing(false);
      onRefresh?.();
    } catch (err) {
      showNotification(err.message || 'Failed to update centre details', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'personnel', label: 'Key Personnel', icon: UserCheck },
    { id: 'docs', label: `Documents (${docs.length})`, icon: FileText },
    { id: 'building', label: 'Building & Labs', icon: Building2 },
    { id: 'power', label: 'Power & Network', icon: Zap },
    { id: 'safety', label: 'Safety & Perimeter', icon: Lock },
    { id: 'bank', label: 'Bank & Commercials', icon: CreditCard },
    { id: 'history', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal modal-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1100,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg-subtle, #f8fafc)',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: '#1e40af',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              {centre.centreName?.charAt(0) || 'C'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  {centre.centreName}
                </h3>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    background: '#e0e7ff',
                    color: '#3730a3',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  {centre.centreCode || centre.id}
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
            {isPrivileged && (
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
              onClick={() => handleOpenInvite(cs?.fullName ? cs : owner)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title="Invite Centre Superintendent / Representative to Centre Portal"
            >
              <Send size={14} /> Invite User
            </button>

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
          {activeTab === 'basic' && (
            <BasicTab
              centre={centre}
              capacity={capacity}
              inf={inf}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editForm={editForm}
              setEditForm={setEditForm}
              handleSaveEdit={handleSaveEdit}
              savingEdit={savingEdit}
            />
          )}

          {activeTab === 'personnel' && (
            <PersonnelTab
              owner={owner}
              cs={cs}
              it={it}
              electrician={electrician}
              handleOpenInvite={handleOpenInvite}
            />
          )}

          {activeTab === 'docs' && (
            <DocsTab
              docs={docs}
              setPreviewDocUrl={setPreviewDocUrl}
              setShowDocActionModal={setShowDocActionModal}
              setDocRemarks={setDocRemarks}
              setDocRejectionReason={setDocRejectionReason}
            />
          )}

          {activeTab === 'building' && (
            <BuildingTab inf={inf} />
          )}

          {activeTab === 'power' && (
            <PowerTab inf={inf} capacity={capacity} />
          )}

          {activeTab === 'safety' && (
            <SafetyTab inf={inf} />
          )}

          {activeTab === 'bank' && (
            <BankTab
              bank={bank}
              showFullAccount={showFullAccount}
              setShowFullAccount={setShowFullAccount}
              setPreviewDocUrl={setPreviewDocUrl}
              setShowBankActionModal={setShowBankActionModal}
              setBankRemarks={setBankRemarks}
              setBankRejectionReason={setBankRejectionReason}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab history={history} />
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
      <ApproveModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        centreName={centre.centreName}
        remarks={approveRemarks}
        setRemarks={setApproveRemarks}
        onConfirm={handleApprove}
        loading={loadingAction}
      />

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        reason={rejectReason}
        setReason={setRejectReason}
        onConfirm={handleReject}
        loading={loadingAction}
      />

      <AuditorModal
        isOpen={showAuditorModal}
        onClose={() => setShowAuditorModal(false)}
        auditorId={selectedAuditorId}
        setAuditorId={setSelectedAuditorId}
        auditDate={auditDate}
        setAuditDate={setAuditDate}
        remarks={auditRemarks}
        setRemarks={setAuditRemarks}
        onConfirm={handleAssignAuditor}
        loading={loadingAction}
      />

      <DocActionModal
        modalState={showDocActionModal}
        onClose={() => setShowDocActionModal(null)}
        remarks={docRemarks}
        setRemarks={setDocRemarks}
        rejectionReason={docRejectionReason}
        setRejectionReason={setDocRejectionReason}
        onConfirm={handleDocAction}
        loading={loadingAction}
      />

      <BankActionModal
        modalState={showBankActionModal}
        onClose={() => setShowBankActionModal(null)}
        remarks={bankRemarks}
        setRemarks={setBankRemarks}
        rejectionReason={bankRejectionReason}
        setRejectionReason={setBankRejectionReason}
        onConfirm={handleBankAction}
        loading={loadingAction}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        centre={centre}
        inviteForm={inviteForm}
        setInviteForm={setInviteForm}
        inviteResult={inviteResult}
        inviting={inviting}
        handleSendInvite={handleSendInvite}
        handleCopyLink={handleCopyLink}
      />

      <DocPreviewModal
        previewUrl={previewDocUrl}
        onClose={() => setPreviewDocUrl(null)}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, UserCheck, FileText, Settings, Zap, ShieldCheck,
  CreditCard, CheckCircle2, ChevronRight, ChevronLeft, Save,
  Send, AlertCircle, Upload, Eye, X, Check, Clock, AlertTriangle,
  Loader2, Download, RefreshCw, FileCheck
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
];

const CENTRE_CATEGORIES = [
  'School',
  'College',
  'University',
  'Government Institution',
  'Private Educational Institution',
  'Polytechnic / Technical Institute',
  'IT / Computer Training Institute',
  'Dedicated Examination Centre',
  'Other'
];

const BUILDING_TYPES = [
  'Independent Building',
  'Commercial Building',
  'Educational Institution Building',
  'Government Building',
  'Residential Building',
  'Industrial Building',
  'Mixed-Use Building',
  'Other'
];

const MAJOR_BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank',
  'Bank of Baroda', 'Axis Bank', 'Canara Bank', 'Union Bank of India',
  'Bank of India', 'IndusInd Bank', 'Kotak Mahindra Bank', 'Yes Bank',
  'IDBI Bank', 'Central Bank of India', 'Indian Bank', 'Other'
];

export default function CentreRegistrationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingCentre, setExistingCentre] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Modal for previewing documents
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  // ── 7-Step Form State ─────────────────────────────────────────────────────
  // Step 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    centreName: '',
    centreCategory: 'College',
    specifiedCategory: '',
    regionId: 'North',
    centreAddress: '',
    stateName: 'Delhi',
    cityName: '',
    taluka: '',
    pincode: '',
    eduCode: '',
    centreCode: '',
    tcCode: '',
    totalNodes: 100,
    previousExamConducted: false,
    previousEduExam: '',
    officialEmail: '',
    officialMobile: '',
    alternateMobile: '',
    phoneStd: '',
    busStandNearby: false,
    busStandName: '',
    metroNearby: false,
    metroStationName: '',
    distanceFromMainRoad: 1,
    signBoards: true,
    printerAvailable: true,
    jammerAvailable: false,
    phFriendly: false,
    phCandidateCount: 0,
    elevatorAvailable: false,
    wheelchairAvailable: false,
    organizationType: 'Trust',
  });

  // Step 2: Personnel Details
  const [personnel, setPersonnel] = useState({
    owner: { fullName: '', contactNumber: '', email: '', aadhaarNumber: '', fatherName: '', permanentAddress: '', currentAddress: '' },
    cs: { fullName: '', contactNumber: '', email: '', aadhaarNumber: '', fatherName: '', permanentAddress: '', currentAddress: '' },
    it: { fullName: '', contactNumber: '', email: '', aadhaarNumber: '', fatherName: '', permanentAddress: '', currentAddress: '' },
    electrician: { fullName: '', contactNumber: '', aadhaarNumber: '' },
  });

  // Step 3: Documents
  const [documents, setDocuments] = useState([]);
  const [uploadingDocType, setUploadingDocType] = useState(null);

  // Step 4: Building & Infrastructure
  const [building, setBuilding] = useState({
    noOfFloors: 2,
    buildingType: 'Educational Institution Building',
    specifiedBuildingType: '',
    noOfLifts: 1,
    noOfEntryGates: 1,
    noOfExitGates: 1,
    buildingNameWing: 'Main Wing',
    floorBuildingDetails: '',
    washroomsEachFloor: 2,
    maleWashroomsEachFloor: 1,
    femaleWashroomsEachFloor: 1,
    noOfCctvCameras: 12,
    cctvLobby: true,
    parkingAvailable: true,
    candidateParkingInside: true,
    receptionArea: true,
    waitingArea: true,
    maleWashroom: true,
    femaleWashroom: true,
    separateWashrooms: true,
    drinkingWater: true,
    acAvailable: true,
    lockerFacility: true,
    separateEntryExit: true,
    suitablePwd: true,
    rampFacility: true,
    railingSupport: true,
    serverRoomAvailable: true,
    acInServerRoom: true,
    serverRoomUpsNetwork: true,
    dedicatedServerRoom: true,
  });

  // Step 5: Power & Network
  const [powerNetwork, setPowerNetwork] = useState({
    upsAvailable: true,
    upsCapacityKva: 20,
    gensetAvailable: true,
    gensetCapacityKva: 40,
    backupGensetAvailable: false,
    backupGensetCapacityKva: 0,
    coreSwitch1Gbps: true,
    primaryInternet: true,
    backupInternet: true,
    ipScanningAvailable: true,
    networkDiagramAvailable: true,
    lanType: 'Single LAN',
  });

  // Step 6: Safety & Security
  const [safety, setSafety] = useState({
    noOfFireExtinguishers: 6,
    fireSafetyClearanceDate: '',
    fireExtinguisherRefillDate: '',
    firstAidKit: true,
    fireExtinguisherEachFloor: true,
    fireEmergencyAccessible: true,
    assemblyArea: true,
    safetySignage: true,
    safeArea: true,
    safeLateHours: true,
    adequateHygiene: true,
    insuranceCoverage: true,
  });

  // Step 7: Bank Details
  const [bank, setBank] = useState({
    accountName: '',
    bankName: 'State Bank of India',
    branchName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'Current Account',
    branchAddress: '',
    cancelledChequeUrl: '',
    passbookUrl: '',
  });

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Existing Centre Application (if any)
  const loadExistingData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.CENTRE_PORTAL.MY_CENTRE);
      if (res && res.success && res.data) {
        const c = res.data;
        setExistingCentre(c);

        if (c.centreStatus === 'Registered' || c.centreStatus === 'Ready to Book' || c.centreStatus === 'Approved') {
          setIsReadOnly(true);
        }

        // Populate Step 1
        setBasicInfo((prev) => ({
          ...prev,
          centreName: c.centreName || '',
          centreCategory: c.centreCategory || 'College',
          regionId: c.regionId || 'North',
          centreAddress: c.centreAddress || '',
          stateName: c.stateName || 'Delhi',
          cityName: c.cityName || '',
          taluka: c.taluka || '',
          pincode: c.pincode || '',
          eduCode: c.eduCode || '',
          centreCode: c.centreCode || '',
          tcCode: c.tcCode || '',
          totalNodes: c.capacity?.examNodes || c.totalNodes || 100,
          previousExamConducted: Boolean(c.previousExamConducted),
          previousEduExam: c.previousEduExam || '',
          officialEmail: c.officialEmail || '',
          officialMobile: c.officialMobile || '',
          alternateMobile: c.alternateMobile || '',
          phoneStd: c.phoneStd || '',
          organizationType: c.organizationType || 'Trust',
          ...(c.infrastructure || {}),
        }));

        // Populate Step 2
        if (c.contacts && Array.isArray(c.contacts)) {
          const ownerContact = c.contacts.find((x) => x.personType === 'Owner') || {};
          const csContact = c.contacts.find((x) => x.personType === 'Centre CS' || x.personType === 'TCA') || {};
          const itContact = c.contacts.find((x) => x.personType === 'IT Person') || {};
          const elecContact = c.contacts.find((x) => x.personType === 'Electrician') || {};

          setPersonnel({
            owner: { ...ownerContact },
            cs: { ...csContact },
            it: { ...itContact },
            electrician: { ...elecContact },
          });
        }

        // Populate Step 3
        if (c.documents && Array.isArray(c.documents)) {
          setDocuments(c.documents);
        }

        // Populate Step 4, 5, 6 from infrastructure
        if (c.infrastructure) {
          const inf = c.infrastructure;
          setBuilding((prev) => ({ ...prev, ...inf }));
          setPowerNetwork((prev) => ({ ...prev, ...inf }));
          setSafety((prev) => ({
            ...prev,
            ...inf,
            fireSafetyClearanceDate: inf.fireSafetyClearanceDate ? inf.fireSafetyClearanceDate.split('T')[0] : '',
            fireExtinguisherRefillDate: inf.fireExtinguisherRefillDate ? inf.fireExtinguisherRefillDate.split('T')[0] : '',
          }));
        }

        // Populate Step 7
        if (c.bankAccount) {
          const b = c.bankAccount;
          setBank({
            accountName: b.accountName || '',
            bankName: b.bankName || 'State Bank of India',
            branchName: b.branchName || '',
            accountNumber: b.accountNumber || '',
            confirmAccountNumber: b.accountNumber || '',
            ifscCode: b.ifscCode || '',
            accountType: b.accountType || 'Current Account',
            branchAddress: b.branchAddress || '',
            cancelledChequeUrl: b.cancelledChequeUrl || '',
            passbookUrl: b.passbookUrl || '',
          });
        }
      }
    } catch (err) {
      console.warn('No active centre record found or failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExistingData();
  }, [loadExistingData]);

  // Save current progress as Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        ...basicInfo,
        contacts: [
          { personType: 'Owner', ...personnel.owner },
          { personType: 'Centre CS', ...personnel.cs },
          { personType: 'IT Person', ...personnel.it },
          { personType: 'Electrician', ...personnel.electrician },
        ],
        infrastructure: {
          ...basicInfo,
          ...building,
          ...powerNetwork,
          ...safety,
        },
        bankAccount: {
          ...bank,
        },
      };

      const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.DRAFT, payload);
      if (res && res.success) {
        showNotification('Registration draft saved to database successfully.');
        setExistingCentre(res.data);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Document Upload Handler (Base64 file reading)
  const handleFileUpload = (docType, docName, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showNotification('File size exceeds 10 MB limit.', 'error');
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      showNotification('Unsupported format. Please upload PDF, JPG, or PNG.', 'error');
      return;
    }

    setUploadingDocType(docType);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileUrl = reader.result;
        // Make sure draft is saved first
        await handleSaveDraft();

        const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.UPLOAD_DOC, {
          documentType: docType,
          documentName: docName,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          mimeType: file.type,
        });

        if (res && res.success) {
          showNotification(`${docName} uploaded successfully.`);
          // Refresh document list
          setDocuments((prev) => {
            const filtered = prev.filter((d) => d.documentType !== docType);
            return [...filtered, res.data];
          });

          // Link to bank proof if cheque
          if (docType === 'cancelled_cheque') {
            setBank((prev) => ({ ...prev, cancelledChequeUrl: fileUrl }));
          }
          if (docType === 'bank_passbook') {
            setBank((prev) => ({ ...prev, passbookUrl: fileUrl }));
          }
        }
      } catch (err) {
        showNotification(err.message || 'Failed to upload document', 'error');
      } finally {
        setUploadingDocType(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Application
  const handleSubmit = async () => {
    // 1. Validate Bank Match before submission
    if (bank.accountNumber && bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber) {
      showNotification('Step 7: Account Number and Confirm Account Number must match exactly.', 'error');
      setActiveStep(7);
      return;
    }

    setSubmitting(true);
    try {
      // First save latest inputs
      await handleSaveDraft();

      const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.SUBMIT, {});
      if (res && res.success) {
        showNotification('Application submitted successfully! Your centre is now under review.', 'success');
        setIsReadOnly(true);
        loadExistingData();
      }
    } catch (err) {
      showNotification(err.message || 'Submission failed. Please check mandatory fields.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, label: 'Basic Info', icon: Building2 },
    { number: 2, label: 'Personnel', icon: UserCheck },
    { number: 3, label: 'Documents', icon: FileText },
    { number: 4, label: 'Facilities', icon: Settings },
    { number: 5, label: 'Power & LAN', icon: Zap },
    { number: 6, label: 'Safety', icon: ShieldCheck },
    { number: 7, label: 'Bank Details', icon: CreditCard },
    { number: 8, label: 'Review & Submit', icon: FileCheck },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
        Loading Centre Registration workspace...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header__top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-header__title">Centre Onboarding & Registration Form</h1>
              {existingCentre?.centreCode && (
                <span className="badge badge-subtle" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {existingCentre.centreCode}
                </span>
              )}
              {existingCentre?.centreStatus && <StatusBadge status={existingCentre.centreStatus} />}
            </div>
            <p className="page-header__subtitle">
              Complete the seven-step official registration dossier to become an accredited CBT examination venue.
            </p>
          </div>

          <div className="page-header__actions" style={{ display: 'flex', gap: 8 }}>
            {!isReadOnly && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSaveDraft}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={13} className={saving ? 'animate-spin' : ''} /> {saving ? 'Saving...' : 'Save Draft'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast Alert ── */}
      {toast && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            borderRadius: 8,
            background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: toast.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.875rem',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Read-Only Submitted Status Banner ── */}
      {isReadOnly && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: 24,
            background: '#f0fdf4',
            border: '1px solid #86efac',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9375rem' }}>
                Application Submitted & In Review ({existingCentre?.centreStatus})
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#15803d', marginTop: 2 }}>
                Your registration application has been submitted to the operations and audit team. You can view all submitted information in read-only mode below.
              </div>
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setActiveStep(8)}
            style={{ background: '#fff', color: '#166534', borderColor: '#86efac' }}
          >
            View Review Summary
          </button>
        </div>
      )}

      {/* ── Progress Wizard Steps Header (Phase 4 UX) ── */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: 24,
          background: 'var(--color-bg-card, #ffffff)',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 780 }}>
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isCurrent = activeStep === st.number;
            const isCompleted = activeStep > st.number || isReadOnly;

            return (
              <div key={st.number} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <button
                  type="button"
                  onClick={() => setActiveStep(st.number)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: 6,
                    color: isCurrent ? '#1e40af' : isCompleted ? '#16a34a' : '#94a3b8',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: isCurrent ? '#eff6ff' : isCompleted ? '#f0fdf4' : '#f1f5f9',
                      border: `2px solid ${isCurrent ? '#1e40af' : isCompleted ? '#16a34a' : '#cbd5e1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                    }}
                  >
                    {isCompleted && !isCurrent ? <Check size={14} /> : st.number}
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: isCurrent ? 700 : 500 }}>
                    {st.label}
                  </span>
                </button>

                {idx < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: activeStep > st.number ? '#16a34a' : '#e2e8f0',
                      margin: '0 8px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step Body Containers ── */}

      {/* STEP 1: Basic Information */}
      {activeStep === 1 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 1 — Centre Basic Identification & Location
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Centre Name (As per Document) *</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.centreName}
                onChange={(e) => setBasicInfo({ ...basicInfo, centreName: e.target.value })}
                placeholder="Enter registered centre name"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Centre Category *</label>
              <select
                className="form-control"
                value={basicInfo.centreCategory}
                onChange={(e) => setBasicInfo({ ...basicInfo, centreCategory: e.target.value })}
                disabled={isReadOnly}
              >
                {CENTRE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Region *</label>
              <select
                className="form-control"
                value={basicInfo.regionId}
                onChange={(e) => setBasicInfo({ ...basicInfo, regionId: e.target.value })}
                disabled={isReadOnly}
              >
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Central">Central</option>
                <option value="North-East">North-East</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Centre Address *</label>
              <textarea
                className="form-control"
                rows={2}
                value={basicInfo.centreAddress}
                onChange={(e) => setBasicInfo({ ...basicInfo, centreAddress: e.target.value })}
                placeholder="Complete postal address of the examination venue"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">State *</label>
              <select
                className="form-control"
                value={basicInfo.stateName}
                onChange={(e) => setBasicInfo({ ...basicInfo, stateName: e.target.value })}
                disabled={isReadOnly}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.cityName}
                onChange={(e) => setBasicInfo({ ...basicInfo, cityName: e.target.value })}
                placeholder="e.g. Mumbai, New Delhi, Pune"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Taluka (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.taluka}
                onChange={(e) => setBasicInfo({ ...basicInfo, taluka: e.target.value })}
                placeholder="Tehsil / Taluka"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label className="form-label">PIN Code (6 digits) *</label>
              <input
                type="text"
                className="form-control"
                maxLength={6}
                value={basicInfo.pincode}
                onChange={(e) => setBasicInfo({ ...basicInfo, pincode: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 110085"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Exam Nodes (Capacity) *</label>
              <input
                type="number"
                className="form-control"
                min={1}
                value={basicInfo.totalNodes}
                onChange={(e) => setBasicInfo({ ...basicInfo, totalNodes: Number(e.target.value) })}
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Edu Code (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.eduCode}
                onChange={(e) => setBasicInfo({ ...basicInfo, eduCode: e.target.value })}
                placeholder="e.g. EDU-104"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label className="form-label">TC Code (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={basicInfo.tcCode}
                onChange={(e) => setBasicInfo({ ...basicInfo, tcCode: e.target.value })}
                placeholder="e.g. TC-990"
                disabled={isReadOnly}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization Type *</label>
              <select
                className="form-control"
                value={basicInfo.organizationType}
                onChange={(e) => setBasicInfo({ ...basicInfo, organizationType: e.target.value })}
                disabled={isReadOnly}
              >
                <option value="Trust">Trust</option>
                <option value="Society">Society</option>
                <option value="Partnership">Partnership</option>
                <option value="Company">Company / Pvt Ltd</option>
                <option value="Individual">Individual Proprietor</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Conditional Previous Examination */}
          <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="checkbox"
                id="prevExam"
                checked={basicInfo.previousExamConducted}
                onChange={(e) => setBasicInfo({ ...basicInfo, previousExamConducted: e.target.checked })}
                disabled={isReadOnly}
              />
              <label htmlFor="prevExam" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Has this centre conducted major computer-based examinations previously?
              </label>
            </div>

            {basicInfo.previousExamConducted && (
              <div style={{ marginTop: 12 }}>
                <label className="form-label">Previous Exam Details *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={basicInfo.previousEduExam}
                  onChange={(e) => setBasicInfo({ ...basicInfo, previousEduExam: e.target.value })}
                  placeholder="e.g. NEET UG 2024, JEE Main 2025, IBPS RRB"
                  disabled={isReadOnly}
                  required
                />
              </div>
            )}
          </div>

          {/* Transit & Accessibility (Section 2.4 & 2.5) */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Transit & Physical Accessibility</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label className="form-label">Local Bus Stand Nearby?</label>
                <select
                  className="form-control"
                  value={basicInfo.busStandNearby ? 'Yes' : 'No'}
                  onChange={(e) => setBasicInfo({ ...basicInfo, busStandNearby: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {basicInfo.busStandNearby && (
                <div>
                  <label className="form-label">Bus Stand Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={basicInfo.busStandName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, busStandName: e.target.value })}
                    placeholder="e.g. Rohini Sector 8 Bus Stand"
                    disabled={isReadOnly}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Metro Station Nearby?</label>
                <select
                  className="form-control"
                  value={basicInfo.metroNearby ? 'Yes' : 'No'}
                  onChange={(e) => setBasicInfo({ ...basicInfo, metroNearby: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {basicInfo.metroNearby && (
                <div>
                  <label className="form-label">Metro Station Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={basicInfo.metroStationName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, metroStationName: e.target.value })}
                    placeholder="e.g. Rohini West Metro Station"
                    disabled={isReadOnly}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Distance from Highway / Main Road (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-control"
                  value={basicInfo.distanceFromMainRoad}
                  onChange={(e) => setBasicInfo({ ...basicInfo, distanceFromMainRoad: Number(e.target.value) })}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="form-label">PH (PwD) Friendly Centre?</label>
                <select
                  className="form-control"
                  value={basicInfo.phFriendly ? 'Yes' : 'No'}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phFriendly: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {basicInfo.phFriendly && (
                <div>
                  <label className="form-label">Dedicated PwD Capacity Count</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={basicInfo.phCandidateCount}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phCandidateCount: Number(e.target.value) })}
                    disabled={isReadOnly}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Personnel Details */}
      {activeStep === 2 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 2 — Owner & Key Operational Personnel
          </h3>

          {/* Section 1: Owner Details */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              1. Owner / Authorized Signatory Details *
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.owner.fullName}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, fullName: e.target.value } })}
                  placeholder="Full name as per Aadhaar / PAN"
                  disabled={isReadOnly}
                  required
                />
              </div>
              <div>
                <label className="form-label">Contact Mobile *</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={personnel.owner.contactNumber}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, contactNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="10-digit mobile number"
                  disabled={isReadOnly}
                  required
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={personnel.owner.email}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, email: e.target.value } })}
                  placeholder="official@email.com"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Aadhaar Number *</label>
                <input
                  type="text"
                  maxLength={12}
                  className="form-control"
                  value={personnel.owner.aadhaarNumber}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, aadhaarNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="12-digit Aadhaar"
                  disabled={isReadOnly}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Permanent Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.owner.permanentAddress}
                  onChange={(e) => setPersonnel({ ...personnel, owner: { ...personnel.owner, permanentAddress: e.target.value } })}
                  placeholder="Residential address"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Centre CS Details */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              2. Centre Superintendent (CS / TCA) Details *
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">CS Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.cs.fullName}
                  onChange={(e) => setPersonnel({ ...personnel, cs: { ...personnel.cs, fullName: e.target.value } })}
                  placeholder="Centre Superintendent name"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Contact Mobile *</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={personnel.cs.contactNumber}
                  onChange={(e) => setPersonnel({ ...personnel, cs: { ...personnel.cs, contactNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="10-digit mobile"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={personnel.cs.email}
                  onChange={(e) => setPersonnel({ ...personnel, cs: { ...personnel.cs, email: e.target.value } })}
                  placeholder="cs@centre.com"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Aadhaar Number</label>
                <input
                  type="text"
                  maxLength={12}
                  className="form-control"
                  value={personnel.cs.aadhaarNumber}
                  onChange={(e) => setPersonnel({ ...personnel, cs: { ...personnel.cs, aadhaarNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="12-digit Aadhaar"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Section 3: IT Person Details */}
          <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              3. Centre IT Person / Network Administrator *
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">IT Lead Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.it.fullName}
                  onChange={(e) => setPersonnel({ ...personnel, it: { ...personnel.it, fullName: e.target.value } })}
                  placeholder="IT lead name"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Contact Mobile *</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={personnel.it.contactNumber}
                  onChange={(e) => setPersonnel({ ...personnel, it: { ...personnel.it, contactNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="10-digit mobile"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={personnel.it.email}
                  onChange={(e) => setPersonnel({ ...personnel, it: { ...personnel.it, email: e.target.value } })}
                  placeholder="it@centre.com"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Electrician Details */}
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
              4. Dedicated Electrician Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">Electrician Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={personnel.electrician.fullName}
                  onChange={(e) => setPersonnel({ ...personnel, electrician: { ...personnel.electrician, fullName: e.target.value } })}
                  placeholder="Electrician name"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="form-label">Mobile Number</label>
                <input
                  type="text"
                  maxLength={10}
                  className="form-control"
                  value={personnel.electrician.contactNumber}
                  onChange={(e) => setPersonnel({ ...personnel, electrician: { ...personnel.electrician, contactNumber: e.target.value.replace(/\D/g, '') } })}
                  placeholder="10-digit mobile"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Document Management */}
      {activeStep === 3 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 3 — Mandatory & Supporting Document Checklist
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.8125rem', color: '#64748b' }}>
            Upload high-resolution PDF or Image proofs (Max 10 MB per document). Mandatory items are marked with an asterisk (*).
          </p>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Mandatory</th>
                  <th>Status</th>
                  <th>File Upload / Replace</th>
                  <th style={{ textAlign: 'right' }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'current_electricity_bill', label: 'Current Electricity Bill', mandatory: true },
                  { key: 'cancelled_cheque', label: 'Cancelled Cheque Copy', mandatory: true },
                  { key: 'centre_pan', label: 'Centre / Entity PAN Card', mandatory: true },
                  { key: 'gst_document', label: 'GST Registration Certificate', mandatory: true },
                  { key: 'ef_data_sheet', label: 'EF Resource Data Sheet', mandatory: true },
                  { key: 'owner_id_proof', label: 'Owner ID Proof (Aadhaar / Voter ID)', mandatory: true },
                  { key: 'mou', label: 'MOU – ₹500 Stamp Paper', mandatory: true },
                  { key: 'nda', label: 'NDA – ₹100 Stamp Paper', mandatory: true },
                  { key: 'registration_certificate', label: 'Establishment / Registration Certificate', mandatory: true },
                  { key: 'trust_society_certificate', label: 'Trust Deed / Society Certificate', mandatory: basicInfo.organizationType === 'Trust' || basicInfo.organizationType === 'Society' },
                  { key: 'partnership_deed', label: 'Partnership Deed & KYC', mandatory: basicInfo.organizationType === 'Partnership' },
                ].map((item) => {
                  const uploaded = documents.find((d) => d.documentType.toLowerCase() === item.key.toLowerCase());
                  const isUploading = uploadingDocType === item.key;

                  return (
                    <tr key={item.key}>
                      <td>
                        <strong>{item.label}</strong>
                        {uploaded && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            File: {uploaded.fileName} (v{uploaded.version})
                          </div>
                        )}
                      </td>
                      <td>
                        {item.mandatory ? (
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>Yes *</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>Conditional</span>
                        )}
                      </td>
                      <td>
                        {uploaded ? (
                          <span className={`badge ${uploaded.status === 'Verified' ? 'badge-success' : uploaded.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {uploaded.status}
                          </span>
                        ) : (
                          <span className="badge badge-subtle">Not Uploaded</span>
                        )}
                      </td>
                      <td>
                        {!isReadOnly && (
                          <label
                            className="btn btn-xs btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                          >
                            <Upload size={12} className={isUploading ? 'animate-spin' : ''} />
                            {isUploading ? 'Uploading...' : uploaded ? 'Replace File' : 'Upload File'}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(item.key, item.label, e.target.files[0]);
                                }
                              }}
                              disabled={isUploading}
                            />
                          </label>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {uploaded?.fileUrl ? (
                          <button
                            type="button"
                            className="btn btn-xs btn-secondary"
                            onClick={() => setPreviewDocUrl(uploaded.fileUrl)}
                          >
                            <Eye size={12} /> View
                          </button>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 4: Building & Infrastructure */}
      {activeStep === 4 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 4 — Building Infrastructure & Facilities
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label className="form-label">No. of Floors</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={building.noOfFloors}
                onChange={(e) => setBuilding({ ...building, noOfFloors: Number(e.target.value) })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="form-label">Building Type</label>
              <select
                className="form-control"
                value={building.buildingType}
                onChange={(e) => setBuilding({ ...building, buildingType: e.target.value })}
                disabled={isReadOnly}
              >
                {BUILDING_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Passenger Lifts Available</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={building.noOfLifts}
                onChange={(e) => setBuilding({ ...building, noOfLifts: Number(e.target.value) })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="form-label">Entry Gates</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={building.noOfEntryGates}
                onChange={(e) => setBuilding({ ...building, noOfEntryGates: Number(e.target.value) })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="form-label">Exit Gates</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={building.noOfExitGates}
                onChange={(e) => setBuilding({ ...building, noOfExitGates: Number(e.target.value) })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="form-label">CCTV Cameras (Active Units)</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={building.noOfCctvCameras}
                onChange={(e) => setBuilding({ ...building, noOfCctvCameras: Number(e.target.value) })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600 }}>Facility Checklist (Yes / No)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {[
                { key: 'separateEntryExit', label: 'Separate Entry & Exit Gates Available?' },
                { key: 'parkingAvailable', label: 'Candidate & Staff Parking Facility Available?' },
                { key: 'candidateParkingInside', label: 'Are Candidates Allowed to Park Inside Campus?' },
                { key: 'receptionArea', label: 'Dedicated Reception & Waiting Area Present?' },
                { key: 'separateWashrooms', label: 'Separate Male & Female Washrooms on Each Floor?' },
                { key: 'drinkingWater', label: 'RO / Clean Drinking Water Area Available?' },
                { key: 'acAvailable', label: 'Air Conditioning (AC) Available in Labs?' },
                { key: 'lockerFacility', label: 'Baggage / Locker Facility for Candidate Items?' },
                { key: 'cctvLobby', label: 'CCTV Surveillance Active in Entry & Lobby?' },
                { key: 'serverRoomAvailable', label: 'Dedicated Server Room Available?' },
                { key: 'dedicatedServerRoom', label: 'Dedicated Access-Controlled Server Room?' },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem' }}>{item.label}</span>
                  <select
                    style={{ width: 80, height: 30, padding: '2px 8px', fontSize: '0.8125rem' }}
                    className="form-control"
                    value={building[item.key] ? 'Yes' : 'No'}
                    onChange={(e) => setBuilding({ ...building, [item.key]: e.target.value === 'Yes' })}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Power & Network */}
      {activeStep === 5 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 5 — Power Resilience & Network Infrastructure
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Online UPS Backup</h4>
              <div>
                <label className="form-label">Online UPS Available?</label>
                <select
                  className="form-control"
                  value={powerNetwork.upsAvailable ? 'Yes' : 'No'}
                  onChange={(e) => setPowerNetwork({ ...powerNetwork, upsAvailable: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {powerNetwork.upsAvailable && (
                <div style={{ marginTop: 12 }}>
                  <label className="form-label">UPS Capacity (KVA) *</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={powerNetwork.upsCapacityKva}
                    onChange={(e) => setPowerNetwork({ ...powerNetwork, upsCapacityKva: Number(e.target.value) })}
                    disabled={isReadOnly}
                    required
                  />
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Diesel Generator (GENSET)</h4>
              <div>
                <label className="form-label">GENSET Available?</label>
                <select
                  className="form-control"
                  value={powerNetwork.gensetAvailable ? 'Yes' : 'No'}
                  onChange={(e) => setPowerNetwork({ ...powerNetwork, gensetAvailable: e.target.value === 'Yes' })}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {powerNetwork.gensetAvailable && (
                <div style={{ marginTop: 12 }}>
                  <label className="form-label">GENSET Capacity (KVA) *</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={powerNetwork.gensetCapacityKva}
                    onChange={(e) => setPowerNetwork({ ...powerNetwork, gensetCapacityKva: Number(e.target.value) })}
                    disabled={isReadOnly}
                    required
                  />
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Network & Internet Infrastructure</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="form-label">Core Switch</label>
                  <select
                    className="form-control"
                    value={powerNetwork.coreSwitch1Gbps ? 'Yes' : 'No'}
                    onChange={(e) => setPowerNetwork({ ...powerNetwork, coreSwitch1Gbps: e.target.value === 'Yes' })}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">1 Gbps Core Switch Available</option>
                    <option value="No">Standard 100 Mbps Switch</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">LAN Architecture</label>
                  <select
                    className="form-control"
                    value={powerNetwork.lanType}
                    onChange={(e) => setPowerNetwork({ ...powerNetwork, lanType: e.target.value })}
                    disabled={isReadOnly}
                  >
                    <option value="Single LAN">Single Unified LAN</option>
                    <option value="Multiple LAN">Multiple Segmented LANs</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Safety & Security */}
      {activeStep === 6 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 6 — Fire Safety, Emergency & Hygiene Standards
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label className="form-label">No. of Fire Extinguishers Installed</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={safety.noOfFireExtinguishers}
                onChange={(e) => setSafety({ ...safety, noOfFireExtinguishers: Number(e.target.value) })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="form-label">Fire Safety Clearance Date</label>
              <input
                type="date"
                className="form-control"
                value={safety.fireSafetyClearanceDate}
                onChange={(e) => setSafety({ ...safety, fireSafetyClearanceDate: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="form-label">Extinguisher Refill Date</label>
              <input
                type="date"
                className="form-control"
                value={safety.fireExtinguisherRefillDate}
                onChange={(e) => setSafety({ ...safety, fireExtinguisherRefillDate: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.9375rem', fontWeight: 600 }}>Emergency & Risk Safeguards</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {[
                { key: 'firstAidKit', label: 'First Aid Medical Kit Available on Campus?' },
                { key: 'fireExtinguisherEachFloor', label: 'Fire Extinguishers Installed on Every Exam Floor?' },
                { key: 'fireEmergencyAccessible', label: 'Clear & Unobstructed Fire Emergency Evacuation Paths?' },
                { key: 'assemblyArea', label: 'Designated Open Assembly Area in Case of Fire/Emergency?' },
                { key: 'safetySignage', label: 'Emergency Exit & Evacuation Signage Installed?' },
                { key: 'adequateHygiene', label: 'Sanitation & Hygiene Standards Regularly Maintained?' },
                { key: 'insuranceCoverage', label: 'Third-Party Asset Loss & Risk Accident Insurance Cover?' },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem' }}>{item.label}</span>
                  <select
                    style={{ width: 80, height: 30, padding: '2px 8px', fontSize: '0.8125rem' }}
                    className="form-control"
                    value={safety[item.key] ? 'Yes' : 'No'}
                    onChange={(e) => setSafety({ ...safety, [item.key]: e.target.value === 'Yes' })}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: Bank Account Details */}
      {activeStep === 7 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' }}>
            Step 7 — Beneficiary Bank Account Details
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.8125rem', color: '#64748b' }}>
            Enter the official bank account of the registered centre or operating legal entity for commercial settlement and exam payouts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Account Holder Name *</label>
              <input
                type="text"
                className="form-control"
                value={bank.accountName}
                onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
                placeholder="Name as recorded in the bank passbook"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Name *</label>
              <select
                className="form-control"
                value={bank.bankName}
                onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                disabled={isReadOnly}
              >
                {MAJOR_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Branch Name *</label>
              <input
                type="text"
                className="form-control"
                value={bank.branchName}
                onChange={(e) => setBank({ ...bank, branchName: e.target.value })}
                placeholder="Branch name (e.g. Rohini Sector 8)"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Number (Digits only) *</label>
              <input
                type="text"
                className="form-control"
                value={bank.accountNumber}
                onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="Account number"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Account Number *</label>
              <input
                type="text"
                className="form-control"
                value={bank.confirmAccountNumber}
                onChange={(e) => setBank({ ...bank, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="Re-enter exact account number"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">IFSC Code (11 characters) *</label>
              <input
                type="text"
                maxLength={11}
                className="form-control"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
                value={bank.ifscCode}
                onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.trim().toUpperCase() })}
                placeholder="e.g. SBIN0001234"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Type *</label>
              <select
                className="form-control"
                value={bank.accountType}
                onChange={(e) => setBank({ ...bank, accountType: e.target.value })}
                disabled={isReadOnly}
              >
                <option value="Current Account">Current Account</option>
                <option value="Savings Account">Savings Account</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Bank Branch Address (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={bank.branchAddress}
                onChange={(e) => setBank({ ...bank, branchAddress: e.target.value })}
                placeholder="Bank branch physical address"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: Final Review & Submission */}
      {activeStep === 8 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 700, color: '#1e40af' }}>
            Final Application Dossier Review
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Basic Info Summary */}
            <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: '0.9375rem' }}>1. Basic Information</strong>
                {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(1)}>Edit</button>}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>Centre: <strong>{basicInfo.centreName || '—'}</strong></div>
                <div>Category: {basicInfo.centreCategory} ({basicInfo.organizationType})</div>
                <div>Location: {basicInfo.cityName}, {basicInfo.stateName} (PIN: {basicInfo.pincode})</div>
                <div>Declared Nodes: <strong>{basicInfo.totalNodes} nodes</strong></div>
              </div>
            </div>

            {/* Personnel Summary */}
            <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: '0.9375rem' }}>2. Personnel Details</strong>
                {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(2)}>Edit</button>}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>Owner: <strong>{personnel.owner.fullName || '—'}</strong> ({personnel.owner.contactNumber || '—'})</div>
                <div>Centre CS: {personnel.cs.fullName || '—'}</div>
                <div>IT Person: {personnel.it.fullName || '—'}</div>
              </div>
            </div>

            {/* Documents Summary */}
            <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: '0.9375rem' }}>3. Uploaded Documents</strong>
                {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(3)}>Edit</button>}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                Total Documents Uploaded: <strong>{documents.length} files</strong>
              </div>
            </div>

            {/* Bank Summary */}
            <div className="card" style={{ padding: 16, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: '0.9375rem' }}>7. Bank Details</strong>
                {!isReadOnly && <button type="button" className="btn btn-xs btn-ghost" onClick={() => setActiveStep(7)}>Edit</button>}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>Beneficiary: <strong>{bank.accountName || '—'}</strong></div>
                <div>Bank: {bank.bankName} ({bank.ifscCode})</div>
                <div>Account: <code>{bank.accountNumber?.length > 4 ? `XXXX XXXX ${bank.accountNumber.slice(-4)}` : bank.accountNumber}</code></div>
              </div>
            </div>
          </div>

          {/* Final Submission CTA */}
          {!isReadOnly && (
            <div style={{ marginTop: 24, padding: 20, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
              <h4 style={{ margin: '0 0 6px', color: '#1e40af', fontSize: '1rem' }}>Ready to submit your application?</h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: '#3b82f6' }}>
                Please ensure all mandatory details and documents are verified. Once submitted, your dossier will be reviewed by OEMP administrators.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ background: '#1e40af', borderColor: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Send size={15} /> {submitting ? 'Submitting Application...' : 'Submit Application Dossier'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Wizard Navigation Controls (Prev / Next) ── */}
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setActiveStep((s) => Math.max(s - 1, 1))}
          disabled={activeStep === 1}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ChevronLeft size={16} /> Previous Step
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isReadOnly && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveDraft}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save as Draft'}
            </button>
          )}

          {activeStep < 8 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveStep((s) => Math.min(s + 1, 8))}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : !isReadOnly ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Final Application'}
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Document Preview Modal ── */}
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
              <button className="btn btn-sm btn-primary" onClick={() => setPreviewDocUrl(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


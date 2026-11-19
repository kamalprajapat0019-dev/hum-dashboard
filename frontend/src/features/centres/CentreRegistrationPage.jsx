import { useState, useEffect, useCallback } from 'react';
import {
  Building2, UserCheck, FileText, Settings, Zap, ShieldCheck,
  CreditCard, CheckCircle2, ChevronRight, ChevronLeft, Save,
  Send, AlertCircle, X, Check, Loader2, FileCheck
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { StatusBadge } from '@/components/common';
import {
  Step1BasicInfo,
  Step2Personnel,
  Step3Documents,
  Step4Building,
  Step5PowerNetwork,
  Step6Safety,
  Step7BankDetails,
  Step8ReviewSubmit,
} from './components/registration-steps';

export default function CentreRegistrationPage() {
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

  // Step 5: Power & LAN Infrastructure
  const [powerNetwork, setPowerNetwork] = useState({
    upsAvailable: true,
    upsCapacityKva: 15,
    upsBackupDurationMins: 60,
    generatorAvailable: true,
    generatorCapacityKva: 25,
    dgFuelArrangement: true,
    autoSwitchover: true,
    dedicatedInternetLine: true,
    primaryIspName: 'Airtel Enterprise',
    primaryBandwidthMbps: 100,
    secondaryIspAvailable: true,
    secondaryIspName: 'Tata Tele',
    secondaryBandwidthMbps: 50,
    lanStructured: true,
    switchType: 'Gigabit Managed 24-Port',
  });

  // Step 6: Safety, Security & Hygiene
  const [safety, setSafety] = useState({
    noOfFireExtinguishers: 4,
    fireSafetyClearanceDate: '',
    fireExtinguisherRefillDate: '',
    firstAidAvailable: true,
    smokeAlarmsAvailable: true,
    emergencyExitsMarked: true,
    securityGuardsAvailable: true,
    noOfSecurityGuards: 2,
    boundaryWall: true,
    friskingArea: true,
  });

  // Step 7: Bank & Commercial Details
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
    setTimeout(() => setToast(null), 4000);
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

      {/* ── Progress Wizard Steps Header ── */}
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
      {activeStep === 1 && (
        <Step1BasicInfo
          basicInfo={basicInfo}
          setBasicInfo={setBasicInfo}
          isReadOnly={isReadOnly}
        />
      )}

      {activeStep === 2 && (
        <Step2Personnel
          personnel={personnel}
          setPersonnel={setPersonnel}
          isReadOnly={isReadOnly}
        />
      )}

      {activeStep === 3 && (
        <Step3Documents
          documents={documents}
          uploadingDocType={uploadingDocType}
          handleFileUpload={handleFileUpload}
          setPreviewDocUrl={setPreviewDocUrl}
          isReadOnly={isReadOnly}
        />
      )}

      {activeStep === 4 && (
        <Step4Building
          building={building}
          setBuilding={setBuilding}
          isReadOnly={isReadOnly}
        />
      )}

      {activeStep === 5 && (
        <Step5PowerNetwork
          powerNetwork={powerNetwork}
          setPowerNetwork={setPowerNetwork}
          isReadOnly={isReadOnly}
        />
      )}

      {activeStep === 6 && (
        <Step6Safety
          safety={safety}
          setSafety={setSafety}
          isReadOnly={isReadOnly}
        />
      )}

      {activeStep === 7 && (
        <Step7BankDetails
          bank={bank}
          setBank={setBank}
          isReadOnly={isReadOnly}
        />
      )}

      {activeStep === 8 && (
        <Step8ReviewSubmit
          basicInfo={basicInfo}
          personnel={personnel}
          documents={documents}
          building={building}
          powerNetwork={powerNetwork}
          safety={safety}
          bank={bank}
          setActiveStep={setActiveStep}
          isReadOnly={isReadOnly}
          handleSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {/* ── Wizard Footer Navigation Bar ── */}
      <div
        className="card"
        style={{
          marginTop: 24,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-bg-card, #ffffff)',
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

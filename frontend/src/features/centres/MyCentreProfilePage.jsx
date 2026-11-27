import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, FileText, LayoutGrid, Zap, CreditCard,
  CheckCircle2, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight,
  Save, Send, Edit, RefreshCw, Eye, X, Loader2, ShieldCheck, Download
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { ENDPOINTS } from '@/services/endpoints';
import { StatusBadge, LastUpdated } from '@/components/common';
import {
  Submodule1BasicInfo,
  Submodule2Personnel,
  Submodule3Documents,
  Submodule4BuildingInfra,
  Submodule5PowerNetwork,
  Submodule6BankDetails,
  SUBMODULE_KEYS,
} from './components/profile-submodules';

const SUBMODULE_CONFIG = [
  { id: 1, key: SUBMODULE_KEYS.BASIC_INFO, label: 'Basic Info', icon: Building2 },
  { id: 2, key: SUBMODULE_KEYS.PERSONNEL, label: 'Personnel', icon: Users },
  { id: 3, key: SUBMODULE_KEYS.DOCUMENTS, label: 'Documents', icon: FileText },
  { id: 4, key: SUBMODULE_KEYS.BUILDING_INFRA, label: 'Building & Labs', icon: LayoutGrid },
  { id: 5, key: SUBMODULE_KEYS.POWER_NETWORK, label: 'Power & Network', icon: Zap },
  { id: 6, key: SUBMODULE_KEYS.BANK_DETAILS, label: 'Bank Details', icon: CreditCard },
];

export default function MyCentreProfilePage() {
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [existingCentre, setExistingCentre] = useState(null);
  const [submoduleReviews, setSubmoduleReviews] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [uploadingBankProof, setUploadingBankProof] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // ── Submodule 1: Basic Information ──────────────────────────────────────────
  const [basicInfo, setBasicInfo] = useState({
    centreName: '',
    centreCategory: '',
    customCentreCategory: '',
    organizationType: '',
    regionId: '',
    centreAddress: '',
    stateName: '',
    cityName: '',
    taluka: '',
    district: '',
    pincode: '',
    eduCode: '',
    tcCode: '',
    venueStatus: '',
    googleMapLink: '',
    officialEmail: '',
    centreOfficialEmail: '',
    officialMobile: '',
    alternateMobile: '',
    actualNodes: '',
    examNodes: '',
    totalNodes: '',
    previousExamConducted: false,
    previousEduExam: '',
    busStandDistanceKm: '',
    metroStationDistanceKm: '',
    distanceFromMainRoad: '',
    canteenArrangement: true,
    canteenRemarks: '',
  });

  // ── Submodule 2: Key Personnel ─────────────────────────────────────────────
  const [personnel, setPersonnel] = useState({
    owner: { fullName: '', contactNumber: '', email: '', aadhaarNumber: '', fatherName: '', permanentAddress: '', photoUrl: '' },
    cs: { fullName: '', contactNumber: '', email: '', aadhaarNumber: '', fatherName: '', permanentAddress: '', photoUrl: '' },
    it: { fullName: '', contactNumber: '', email: '', aadhaarNumber: '', fatherName: '', permanentAddress: '', photoUrl: '' },
    electrician: { fullName: '', contactNumber: '', aadhaarNumber: '', photoUrl: '' },
  });

  // ── Submodule 3: Documents ─────────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);

  // ── Submodule 4: Building & Infrastructure ────────────────────────────────
  const [infrastructure, setInfrastructure] = useState({
    totalWashrooms: 4,
    maleWashrooms: 2,
    femaleWashrooms: 2,
    noOfFireExtinguishers: 6,
    dedicatedServerRoom: true,
    drinkingWater: true,
    cctvCoverage: true,
    pwdAccessible: true,
    firstAidAvailable: true,
    emergencyExitsMarked: true,
  });

  const [buildings, setBuildings] = useState([
    {
      buildingName: 'Main Academic Block',
      buildingOrder: 1,
      noOfFloors: 1,
      entryGateCount: 1,
      exitGateCount: 1,
      receptionPresent: true,
      waitingAreaPresent: true,
      drinkingWaterAvailable: true,
      liftAvailable: false,
      noOfLifts: 0,
      floors: [
        {
          floorName: 'Ground Floor',
          floorOrder: 1,
          noOfLabs: 1,
          washroomsAvailable: true,
          totalWashrooms: 2,
          maleWashrooms: 1,
          femaleWashrooms: 1,
          drinkingWaterAvailable: true,
          acAvailable: true,
          sufficientFans: true,
          fireExtinguisherAvailable: true,
          cctvCoverage: true,
          pwdAccessible: true,
          rampOrLiftAccess: true,
          pwdWashroomAvailable: true,
          labs: [
            {
              labName: 'Lab 01 - CBT',
              labOrder: 1,
              labType: 'Dedicated CBT Lab',
              totalNodes: 50,
              examNodes: 40,
              workingNodes: 48,
              pwdSuitable: true,
              adjacentComputerDistanceFt: 2.5,
              partitionAvailable: true,
              partitionType: 'Wood',
              systemOwnership: 'Owned',
              canFormatSystems: true,
              canChangeIp: true,
              canChangeSystemNames: true,
              internetAvailable: true,
              upsAvailable: true,
              cctvAvailable: true,
              cctvCount: 4,
              jammerInstallable: true,
              fireExtinguisherAvailable: true,
              firstAidAvailable: true,
            },
          ],
        },
      ],
    },
  ]);

  // ── Submodule 5: Power Resilience & Network ────────────────────────────────
  const [powerNetwork, setPowerNetwork] = useState({
    upsAvailable: true,
    upsCapacityKva: 20,
    upsBackupDurationMins: 60,
    batteryAgeMonths: 12,
    generatorAvailable: true,
    gensetAvailable: true,
    generatorCapacityKva: 40,
    gensetCapacityKva: 40,
    autoSwitchover: true,
    dgFuelArrangement: true,
    backupGeneratorAvailable: false,
    backupGeneratorCapacityKva: 0,
    electricianSlaAvailable: true,
    electricianSlaDetails: '',
    dedicatedInternetLine: true,
    primaryIspName: 'Airtel Enterprise',
    primaryBandwidthMbps: 100,
    secondaryIspAvailable: true,
    secondaryIspName: 'Tata Tele',
    secondaryBandwidthMbps: 50,
    coreSwitch1Gbps: true,
    lanType: 'Single Unified LAN',
    wirelessDonglesCount: 2,
    networkAdminsCount: 2,
    spareMonitors: true,
    spareKeyboardsMice: true,
    sparePatchCables: true,
    spareSmpsRam: true,
  });

  // ── Submodule 6: Bank & Commercial Details ─────────────────────────────────
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
    proofFileName: '',
  });

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load Centre Profile from Server ─────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(ENDPOINTS.CENTRE_PORTAL.MY_CENTRE);
      if (res && res.success && res.data) {
        const c = res.data;
        setExistingCentre(c);

        if (c.centreStatus === 'Approved' || c.centreStatus === 'Ready to Book') {
          setIsReadOnly(true);
        }

        // Submodule reviews
        if (c.submoduleReviews && Array.isArray(c.submoduleReviews)) {
          setSubmoduleReviews(c.submoduleReviews);
        }

        // Media assets
        if (c.mediaAssets && Array.isArray(c.mediaAssets)) {
          setMediaAssets(c.mediaAssets);
        }

        // 1. Basic Info
        setBasicInfo((prev) => ({
          ...prev,
          centreName: c.centreName || '',
          centreCategory: c.centreCategory || 'School',
          customCentreCategory: c.customCentreCategory || '',
          organizationType: c.organizationType || 'Trust/Society',
          regionId: c.regionId || 'NR',
          centreAddress: c.centreAddress || '',
          stateName: c.stateName || 'Delhi',
          cityName: c.cityName || '',
          district: c.district || '',
          taluka: c.taluka || '',
          pincode: c.pincode || '',
          eduCode: c.eduCode || '',
          tcCode: c.tcCode || '',
          venueStatus: c.venueStatus || 'Commercial',
          googleMapLink: c.googleMapLink || '',
          officialEmail: c.centreOfficialEmail || c.officialEmail || '',
          centreOfficialEmail: c.centreOfficialEmail || c.officialEmail || '',
          alternativeEmail: c.centreAlternateEmail || c.alternativeEmail || '',
          centreAlternateEmail: c.centreAlternateEmail || c.alternativeEmail || '',
          officialMobile: c.centreOfficialMobile || c.officialMobile || '',
          centreOfficialMobile: c.centreOfficialMobile || c.officialMobile || '',
          whatsappMobile: c.centreWhatsappMobile || c.whatsappMobile || '',
          centreWhatsappMobile: c.centreWhatsappMobile || c.whatsappMobile || '',
          alternateMobile: c.centreAlternateMobile || c.alternateMobile || '',
          centreAlternateMobile: c.centreAlternateMobile || c.alternateMobile || '',
          phoneStd: c.centrePhoneNumberWithStdCode || c.phoneStd || '',
          centrePhoneNumberWithStdCode: c.centrePhoneNumberWithStdCode || c.phoneStd || c.landlineStd || '',
          landlineStd: c.landlineStd || '',
          actualNodes: c.capacity?.totalSystems || c.capacity?.actualNodes || c.actualNodes || 100,
          examNodes: c.capacity?.examNodes || c.examNodes || 80,
          totalNodes: c.capacity?.totalSystems || c.totalNodes || 100,
          previousExamConducted: Boolean(c.previousExamConducted),
          previousEduExam: c.previousEduExam || '',
          previousExamName: c.previousExamName || '',
          previousExamDate: c.previousExamDate ? String(c.previousExamDate).split('T')[0] : '',
          busStandNearby: Boolean(c.busStandNearby),
          busStandName: c.busStandName || '',
          railwayStationNearby: Boolean(c.railwayStationNearby),
          railwayStationName: c.railwayStationName || '',
          mainRoadDistanceKm: c.mainRoadDistanceKm ?? '',
          signBoardsAvailable: Boolean(c.signBoardsAvailable),
          hotelsNearby: Boolean(c.hotelsNearby),
          nearestHotelDistanceKm: c.nearestHotelDistanceKm ?? '',
          canteenAvailable: Boolean(c.canteenAvailable),
          canteenFoodForStaff: Boolean(c.canteenFoodForStaff),
          foodForTestingDays: Boolean(c.foodForTestingDays),
          foodForMockDays: Boolean(c.foodForMockDays),
          outsideFoodPossible: Boolean(c.outsideFoodPossible),
          outsideFoodDetails: c.outsideFoodDetails || '',
          ...(c.infrastructure || {}),
        }));

        // 2. Personnel
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

        // 3. Documents
        if (c.documents && Array.isArray(c.documents)) {
          setDocuments(c.documents);
        }

        // 4. Infrastructure & Buildings
        if (c.infrastructure) {
          setInfrastructure((prev) => ({ ...prev, ...c.infrastructure }));
          setPowerNetwork((prev) => ({ ...prev, ...c.infrastructure }));
        }

        if (c.buildings && Array.isArray(c.buildings) && c.buildings.length > 0) {
          setBuildings(c.buildings);
        }

        // 6. Bank Account
        if (c.bankAccount) {
          const b = c.bankAccount;
          setBank({
            accountName: b.accountName || '',
            bankName: b.bankName || 'State Bank of India',
            branchName: b.branchName || '',
            accountNumber: b.accountNumber || '',
            confirmAccountNumber: b.accountNumber || '',
            ifscCode: b.ifscCode || '',
            accountType: b.accountType?.includes('Savings') ? 'Savings' : 'Current',
            branchAddress: b.branchAddress || '',
            cancelledChequeUrl: b.cancelledChequeUrl || '',
            proofFileName: b.proofFileName || '',
          });
        }
      }
    } catch (err) {
      console.warn('Could not load centre profile:', err);
      setError(err.message || 'Failed to load centre profile from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Helper: Get Submodule Review Status ────────────────────────────────────
  const getSubmoduleReview = (submoduleKey) => {
    return submoduleReviews.find((r) => r.submoduleKey === submoduleKey) || {
      status: 'NOT_STARTED',
      reworkReason: null,
    };
  };

  const reworkRequiredSubmodules = submoduleReviews.filter((r) => r.status === 'REWORK_REQUIRED');

  // ── Save Draft Operation ──────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSaving(true);
    setValidationErrors({});

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
          ...infrastructure,
          ...powerNetwork,
        },
        bankAccount: {
          ...bank,
        },
        buildings,
      };

      const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.DRAFT, payload);
      if (res && res.success) {
        showNotification('Centre profile draft saved to database successfully.');
        setExistingCentre(res.data);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to save centre draft.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Document Upload ───────────────────────────────────────────────────────
  const handleUploadDocument = async (docData) => {
    setUploadingDocType(docData.documentType);
    try {
      // Auto-save draft first to ensure centre record exists
      await handleSaveDraft();

      const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.UPLOAD_DOC, docData);
      if (res && res.success) {
        showNotification(`${docData.documentName} uploaded successfully.`);
        setDocuments((prev) => {
          const filtered = prev.filter((d) => d.documentType !== docData.documentType);
          return [res.data, ...filtered];
        });

        if (docData.documentType === 'cancelled_cheque') {
          setBank((prev) => ({
            ...prev,
            cancelledChequeUrl: docData.fileUrl,
            proofFileName: docData.fileName,
          }));
        }
      }
    } catch (err) {
      showNotification(err.message || 'Failed to upload document.', 'error');
      throw err;
    } finally {
      setUploadingDocType(null);
    }
  };

  // ── Media Photo Upload ────────────────────────────────────────────────────
  const handleUploadMedia = async (mediaData) => {
    try {
      await handleSaveDraft();
      const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.UPLOAD_MEDIA, mediaData);
      if (res && res.success) {
        showNotification(`Photo for ${mediaData.entityId} uploaded successfully.`);
        setMediaAssets((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to upload media.', 'error');
      throw err;
    }
  };

  // ── View Document Download / Modal ─────────────────────────────────────────
  const handleViewDocument = async (doc) => {
    if (!doc) return;
    try {
      const res = await apiClient.get(ENDPOINTS.CENTRE_PORTAL.DOC_DOWNLOAD(doc.id));
      if (res && res.success && res.data?.fileUrl) {
        setPreviewDoc({ ...doc, fileUrl: res.data.fileUrl });
      } else if (doc.fileUrl) {
        setPreviewDoc(doc);
      } else {
        showNotification('Unable to generate preview link for this document.', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to download document view.', 'error');
    }
  };

  // ── Delete Document ────────────────────────────────────────────────────────
  const handleDeleteDocument = async (docId) => {
    try {
      const res = await apiClient.delete(ENDPOINTS.CENTRE_PORTAL.DELETE_DOC(docId));
      if (res && res.success) {
        showNotification('Document deleted successfully.');
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (err) {
      showNotification(err.message || 'Failed to delete document.', 'error');
    }
  };

  // ── Final Submission ──────────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    // 1. Mandatory validation checks
    const errors = {};
    if (!basicInfo.centreName?.trim()) errors.centreName = 'Centre Name is required.';
    if (!basicInfo.centreAddress?.trim()) errors.centreAddress = 'Centre Address is required.';
    if (!basicInfo.pincode?.trim() || basicInfo.pincode.length !== 6) errors.pincode = 'Valid 6-digit PIN code required.';
    if (!personnel.owner?.fullName?.trim()) errors.ownerName = 'Owner full name is required.';
    if (!personnel.owner?.contactNumber || personnel.owner.contactNumber.length !== 10) errors.ownerMobile = 'Owner 10-digit mobile required.';
    if (!bank.accountNumber?.trim()) errors.accountNumber = 'Bank account number required.';
    if (!bank.ifscCode?.trim() || bank.ifscCode.length !== 11) errors.ifscCode = 'Valid 11-char IFSC required.';
    if (Number(basicInfo.examNodes || 0) > Number(basicInfo.actualNodes || basicInfo.totalNodes || 0)) {
      errors.examNodes = 'Exam Nodes cannot exceed Actual Nodes.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShowSubmitModal(false);
      showNotification('Please correct highlighted missing mandatory fields before submitting.', 'error');
      setActiveTab(1);
      return;
    }

    // 2. Mandatory compliance documents check
    const uploadedTypes = new Set(documents.map((d) => d.documentType?.toLowerCase()));
    const missingDocs = [];
    if (!uploadedTypes.has('current_electricity_bill') && !uploadedTypes.has('electricity_bill')) {
      missingDocs.push('Electricity Bill');
    }
    if (!uploadedTypes.has('cancelled_cheque')) {
      missingDocs.push('Cancelled Cheque');
    }
    if (!uploadedTypes.has('centre_pan')) {
      missingDocs.push('Centre PAN');
    }
    if (!uploadedTypes.has('gst_document') && !uploadedTypes.has('gst_certificate')) {
      missingDocs.push('GST Document');
    }

    if (missingDocs.length > 0) {
      showNotification(`Missing mandatory document(s): ${missingDocs.join(', ')}. Please upload them in the Documents tab before submitting.`, 'error');
      setShowSubmitModal(false);
      setActiveTab(3);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save latest draft
      await handleSaveDraft();

      // 2. Submit application
      const res = await apiClient.post(ENDPOINTS.CENTRE_PORTAL.SUBMIT);
      if (res && res.success) {
        showNotification('Centre Application submitted for PM & Operations review!', 'success');
        setShowSubmitModal(false);
        await loadProfile();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to submit centre application.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Navigation Controls ──
  const handleNextTab = () => {
    if (activeTab < 6) setActiveTab((prev) => prev + 1);
  };

  const handlePrevTab = () => {
    if (activeTab > 1) setActiveTab((prev) => prev - 1);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 14 }}>
        <Loader2 size={36} className="animate-spin" color="var(--color-primary, #2563eb)" />
        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
          Loading Centre Profile dossier...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <AlertCircle size={42} color="var(--color-danger, #dc2626)" style={{ marginBottom: 12 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Failed to Load Centre Profile</h3>
        <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{error}</p>
        <button className="btn btn-primary" onClick={loadProfile} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Retry Loading
        </button>
      </div>
    );
  }

  const currentSubmoduleKey = SUBMODULE_CONFIG.find((s) => s.id === activeTab)?.key;
  const currentReview = getSubmoduleReview(currentSubmoduleKey);

  return (
    <div className="centre-profile-page" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      {/* ── Toast Feedback ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 'var(--radius-md, 8px)',
            background: toast.type === 'error' ? 'var(--color-danger, #dc2626)' : 'var(--color-success, #16a34a)',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* ── Top Header Bar ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 className="page-header__title" style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>
                {basicInfo.centreName || 'My Centre Profile'}
              </h1>
              <span
                className="badge badge-primary"
                style={{ fontFamily: 'monospace', fontSize: '0.8125rem', letterSpacing: '0.04em' }}
              >
                {existingCentre?.centreCode || 'CTR-DRAFT'}
              </span>
              <StatusBadge status={existingCentre?.centreStatus || 'Draft'} />
            </div>
            <p className="page-header__subtitle" style={{ margin: '6px 0 0', fontSize: '0.84rem' }}>
              Operations & Examination Management Dossier • {basicInfo.organizationType} • {basicInfo.cityName || 'City'}, {basicInfo.stateName || 'State'}
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${isReadOnly ? 'btn-secondary' : 'btn-subtle'}`}
              onClick={() => setIsReadOnly(!isReadOnly)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Edit size={14} />
              {isReadOnly ? 'Enable Editing' : 'View Mode'}
            </button>

            {!isReadOnly && (
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleSaveDraft}
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={14} className={saving ? 'animate-spin' : ''} />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
            )}

            {!isReadOnly && existingCentre?.centreStatus !== 'Approved' && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setShowSubmitModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={14} />
                Final Submit
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm btn-subtle"
              onClick={loadProfile}
              title="Refresh Profile"
            >
              <RefreshCw size={14} />
            </button>

            <LastUpdated />
          </div>
        </div>
      </div>

      {/* ── Global Rework Warning Alert (if any submodule requires rework) ── */}
      {reworkRequiredSubmodules.length > 0 && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'var(--color-danger-bg, #fef2f2)',
            border: '1px solid var(--color-danger-border, #fca5a5)',
            color: 'var(--color-danger, #b91c1c)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
              Action Required: {reworkRequiredSubmodules.length} Section(s) Marked for Rework
            </div>
            <div style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>
              Project Management or Operations has returned sections of your centre profile for correction.
              Check tabs highlighted with an exclamation badge (<strong>!</strong>) and update the corresponding fields.
            </div>
          </div>
        </div>
      )}

      {/* ── 6 Submodule Navigation Tabs with Status & Rework Badges ── */}
      <div
        className="profile-submodule-tabs"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 8,
          background: 'var(--bg-surface, #ffffff)',
          padding: 8,
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        {SUBMODULE_CONFIG.map((sub) => {
          const rev = getSubmoduleReview(sub.key);
          const isRevRework = rev.status === 'REWORK_REQUIRED';
          const isRevVerified = rev.status === 'VERIFIED';
          const isActive = activeTab === sub.id;
          const SubIcon = sub.icon;

          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveTab(sub.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 10px',
                borderRadius: 'var(--radius-md, 8px)',
                border: isRevRework
                  ? '2px solid var(--color-danger, #dc2626)'
                  : isActive
                    ? '2px solid var(--color-primary, #2563eb)'
                    : '1px solid transparent',
                background: isActive
                  ? 'var(--color-primary-bg, #eff6ff)'
                  : isRevRework
                    ? 'var(--color-danger-bg, #fef2f2)'
                    : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <SubIcon
                  size={16}
                  color={
                    isRevRework
                      ? 'var(--color-danger, #dc2626)'
                      : isActive
                        ? 'var(--color-primary, #2563eb)'
                        : 'var(--text-secondary, #64748b)'
                  }
                />
                <span
                  style={{
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.8125rem',
                    color: isRevRework
                      ? 'var(--color-danger, #dc2626)'
                      : isActive
                        ? 'var(--color-primary, #2563eb)'
                        : 'var(--text-primary, #1e293b)',
                  }}
                >
                  {sub.label}
                </span>
              </div>

              {/* Status Badge */}
              <div style={{ marginTop: 2 }}>
                {isRevRework ? (
                  <span
                    className="badge badge-danger"
                    style={{
                      fontSize: '0.68rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <AlertCircle size={10} /> Rework !
                  </span>
                ) : isRevVerified ? (
                  <span
                    className="badge badge-success"
                    style={{
                      fontSize: '0.68rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <CheckCircle2 size={10} /> Verified
                  </span>
                ) : (
                  <span className="badge badge-subtle" style={{ fontSize: '0.68rem' }}>
                    {rev.status || 'Draft'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Active Submodule Content ── */}
      <div className="submodule-viewport">
        {activeTab === 1 && (
          <Submodule1BasicInfo
            basicInfo={basicInfo}
            setBasicInfo={setBasicInfo}
            isReadOnly={isReadOnly}
            reviewStatus={currentReview.status}
            reworkReason={currentReview.reworkReason}
            validationErrors={validationErrors}
          />
        )}

        {activeTab === 2 && (
          <Submodule2Personnel
            personnel={personnel}
            setPersonnel={setPersonnel}
            isReadOnly={isReadOnly}
            reviewStatus={currentReview.status}
            reworkReason={currentReview.reworkReason}
            mediaAssets={mediaAssets}
            onUploadMedia={handleUploadMedia}
            validationErrors={validationErrors}
          />
        )}

        {activeTab === 3 && (
          <Submodule3Documents
            documents={documents}
            organizationType={basicInfo.organizationType}
            isReadOnly={isReadOnly}
            reviewStatus={currentReview.status}
            reworkReason={currentReview.reworkReason}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onViewDocument={handleViewDocument}
            uploadingDocType={uploadingDocType}
          />
        )}

        {activeTab === 4 && (
          <Submodule4BuildingInfra
            infrastructure={infrastructure}
            setInfrastructure={setInfrastructure}
            buildings={buildings}
            setBuildings={setBuildings}
            isReadOnly={isReadOnly}
            reviewStatus={currentReview.status}
            reworkReason={currentReview.reworkReason}
            onSaveAndAddBuilding={async () => {
              await handleSaveDraft();
              setActiveTab(4);
            }}
            onUploadDocument={handleUploadDocument}
            onUploadMedia={handleUploadMedia}
            documents={documents}
            mediaAssets={mediaAssets}
          />
        )}

        {activeTab === 5 && (
          <Submodule5PowerNetwork
            powerNetwork={powerNetwork}
            setPowerNetwork={setPowerNetwork}
            isReadOnly={isReadOnly}
            reviewStatus={currentReview.status}
            reworkReason={currentReview.reworkReason}
            onUploadDocument={handleUploadDocument}
            onUploadMedia={handleUploadMedia}
            documents={documents}
            mediaAssets={mediaAssets}
          />
        )}

        {activeTab === 6 && (
          <Submodule6BankDetails
            bank={bank}
            setBank={setBank}
            isReadOnly={isReadOnly}
            reviewStatus={currentReview.status}
            reworkReason={currentReview.reworkReason}
            onUploadProof={handleUploadDocument}
            uploadingProof={uploadingBankProof}
            validationErrors={validationErrors}
          />
        )}
      </div>

      {/* ── Bottom Step Navigation & Action Bar (FRD Sec. 11) ── */}
      <div
        className="card"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePrevTab}
          disabled={activeTab === 1}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isReadOnly && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsReadOnly(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Edit size={14} /> Edit Profile
            </button>
          )}

          {!isReadOnly && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveDraft}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={14} className={saving ? 'animate-spin' : ''} />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}

          {activeTab < 6 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextTab}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            !isReadOnly && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowSubmitModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={14} /> Final Submit Application
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="modal"
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg, 12px)',
              width: '100%',
              maxWidth: 850,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} color="var(--color-primary)" />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  {previewDoc.documentName || previewDoc.fileName}
                </h4>
              </div>
              <button
                type="button"
                className="btn btn-subtle btn-xs"
                onClick={() => setPreviewDoc(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#f8fafc', minHeight: 400 }}>
              {previewDoc.fileUrl?.startsWith('data:image') || previewDoc.mimeType?.startsWith('image/') ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.documentName}
                  style={{ maxWidth: '100%', height: 'auto', margin: '0 auto', display: 'block', borderRadius: 8 }}
                />
              ) : previewDoc.fileUrl?.startsWith('data:application/pdf') || previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.documentName}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <FileText size={48} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                  <p>Preview not directly supported in this browser frame.</p>
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Final Submission Confirmation Modal ── */}
      {showSubmitModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            className="modal"
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg, 12px)',
              width: '100%',
              maxWidth: 580,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--color-primary-bg, #eff6ff)',
                  color: 'var(--color-primary, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  Submit Centre Profile Dossier?
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Initiates formal verification by Project Management and Operations.
                </span>
              </div>
            </div>

            {documents.length < 4 && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md, 6px)',
                  background: 'var(--color-warning-bg, #fffbeb)',
                  border: '1px solid var(--color-warning-border, #fcd34d)',
                  color: 'var(--color-warning-text, #92400e)',
                  fontSize: '0.8125rem',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Notice:</strong> At least 4 mandatory compliance documents (PAN, GST, Electricity Bill, Cancelled Cheque) are required before application approval.
                </span>
              </div>
            )}

            <div
              style={{
                padding: 14,
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                fontSize: '0.84rem',
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Pre-Submission Checklist:</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Centre: <strong>{basicInfo.centreName}</strong> ({basicInfo.cityName}, {basicInfo.stateName})</li>
                <li>Exam Capacity: <strong>{basicInfo.examNodes} Exam Nodes</strong> ({basicInfo.actualNodes} Total)</li>
                <li>Compliance Documents Uploaded: <strong>{documents.length} File(s)</strong></li>
                <li>Beneficiary Bank: <strong>{bank.bankName}</strong> (A/C: XXXX-{bank.accountNumber?.slice(-4)})</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinalSubmit}
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Confirm & Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

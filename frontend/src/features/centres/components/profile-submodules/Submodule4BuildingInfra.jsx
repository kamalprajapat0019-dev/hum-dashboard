import React, { useState } from 'react';
import {
  AlertCircle, CheckCircle2, Building2, Layers, Monitor, Plus, Trash2,
  ChevronDown, ChevronRight, Shield, Flame, Check, HelpCircle, Save,
  Upload, Eye, FileText, Camera, ShieldCheck
} from 'lucide-react';
import { BUILDING_TYPES, LAB_TYPES, PARTITION_TYPES, SYSTEM_OWNERSHIP_TYPES } from './constants';
import { validateDocumentFile, validateAndCompressPhoto } from '@/utils/fileValidation';

export function Submodule4BuildingInfra({
  infrastructure = {},
  setInfrastructure,
  buildings = [],
  setBuildings,
  isReadOnly = false,
  reviewStatus = 'NOT_STARTED',
  reworkReason = '',
  onSaveAndAddBuilding,
  onUploadDocument,
  onUploadMedia,
  documents = [],
  mediaAssets = [],
}) {
  const isRework = reviewStatus === 'REWORK_REQUIRED';
  const isVerified = reviewStatus === 'VERIFIED';

  const [activeBuildingIndex, setActiveBuildingIndex] = useState(0);
  const [expandedFloors, setExpandedFloors] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const getDoc = (type) => documents.find((d) => d.documentType === type || d.documentType === type?.toLowerCase());

  const handleFileUpload = async (file, docType, docName, isPhotoOnly = false) => {
    if (!file) return;
    setUploadError(null);
    setUploadingDoc(docType);

    try {
      let result;
      const isPdf = file.type === 'application/pdf';

      if (isPhotoOnly) {
        result = await validateAndCompressPhoto(file);
      } else if (isPdf) {
        result = await validateDocumentFile(file);
      } else {
        result = await validateAndCompressPhoto(file);
      }

      if (!result.success) {
        setUploadError(result.error);
        return;
      }

      if (onUploadDocument) {
        await onUploadDocument({
          documentType: docType,
          documentName: docName,
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          fileSize: result.finalSizeBytes,
          mimeType: result.mimeType,
        });
      }
    } catch (err) {
      setUploadError(err.message || `Failed to upload ${docName}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleInfraChange = (field, value) => {
    setInfrastructure((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ── Hierarchy Builders ──
  const handleAddBuilding = () => {
    const newBuildingOrder = buildings.length + 1;
    const newBuilding = {
      buildingName: `Building ${String.fromCharCode(64 + newBuildingOrder)}`,
      buildingOrder: newBuildingOrder,
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
              labName: 'Lab 01',
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
    };

    setBuildings((prev) => [...prev, newBuilding]);
    setActiveBuildingIndex(buildings.length);
  };

  const handleDeleteBuilding = (bIndex) => {
    if (buildings.length <= 1) return;
    setBuildings((prev) => prev.filter((_, idx) => idx !== bIndex));
    if (activeBuildingIndex >= bIndex && activeBuildingIndex > 0) {
      setActiveBuildingIndex(activeBuildingIndex - 1);
    }
  };

  const handleUpdateBuilding = (bIndex, field, value) => {
    setBuildings((prev) => {
      const copy = [...prev];
      copy[bIndex] = { ...copy[bIndex], [field]: value };
      return copy;
    });
  };

  const handleAddFloor = (bIndex) => {
    setBuildings((prev) => {
      const copy = [...prev];
      const currentB = copy[bIndex];
      const floorOrder = (currentB.floors?.length || 0) + 1;
      const newFloor = {
        floorName: `Floor ${floorOrder}`,
        floorOrder,
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
        pwdAccessible: false,
        rampOrLiftAccess: false,
        pwdWashroomAvailable: false,
        labs: [
          {
            labName: `Lab ${floorOrder}01`,
            labOrder: 1,
            labType: 'Dedicated CBT Lab',
            totalNodes: 40,
            examNodes: 35,
            workingNodes: 40,
            pwdSuitable: false,
            adjacentComputerDistanceFt: 2.0,
            partitionAvailable: true,
            partitionType: 'Wood',
            systemOwnership: 'Owned',
            canFormatSystems: true,
            canChangeIp: true,
            canChangeSystemNames: true,
            internetAvailable: true,
            upsAvailable: true,
            cctvAvailable: true,
            cctvCount: 3,
            jammerInstallable: true,
            fireExtinguisherAvailable: true,
            firstAidAvailable: true,
          },
        ],
      };

      copy[bIndex] = {
        ...currentB,
        noOfFloors: floorOrder,
        floors: [...(currentB.floors || []), newFloor],
      };
      return copy;
    });
  };

  const handleDeleteFloor = (bIndex, fIndex) => {
    setBuildings((prev) => {
      const copy = [...prev];
      const currentB = copy[bIndex];
      if ((currentB.floors?.length || 0) <= 1) return copy;
      copy[bIndex] = {
        ...currentB,
        noOfFloors: currentB.floors.length - 1,
        floors: currentB.floors.filter((_, idx) => idx !== fIndex),
      };
      return copy;
    });
  };

  const handleUpdateFloor = (bIndex, fIndex, field, value) => {
    setBuildings((prev) => {
      const copy = [...prev];
      const currentB = copy[bIndex];
      const floors = [...(currentB.floors || [])];
      floors[fIndex] = { ...floors[fIndex], [field]: value };
      copy[bIndex] = { ...currentB, floors };
      return copy;
    });
  };

  const handleAddLab = (bIndex, fIndex) => {
    setBuildings((prev) => {
      const copy = [...prev];
      const currentB = copy[bIndex];
      const floors = [...(currentB.floors || [])];
      const currentF = floors[fIndex];
      const labOrder = (currentF.labs?.length || 0) + 1;
      const newLab = {
        labName: `Lab ${currentF.floorOrder}0${labOrder}`,
        labOrder,
        labType: 'Dedicated CBT Lab',
        totalNodes: 30,
        examNodes: 25,
        workingNodes: 30,
        pwdSuitable: false,
        adjacentComputerDistanceFt: 2.0,
        partitionAvailable: true,
        partitionType: 'Wood',
        systemOwnership: 'Owned',
        canFormatSystems: true,
        canChangeIp: true,
        canChangeSystemNames: true,
        internetAvailable: true,
        upsAvailable: true,
        cctvAvailable: true,
        cctvCount: 2,
        jammerInstallable: true,
        fireExtinguisherAvailable: true,
        firstAidAvailable: true,
      };

      floors[fIndex] = {
        ...currentF,
        noOfLabs: labOrder,
        labs: [...(currentF.labs || []), newLab],
      };
      copy[bIndex] = { ...currentB, floors };
      return copy;
    });
  };

  const handleDeleteLab = (bIndex, fIndex, lIndex) => {
    setBuildings((prev) => {
      const copy = [...prev];
      const currentB = copy[bIndex];
      const floors = [...(currentB.floors || [])];
      const currentF = floors[fIndex];
      if ((currentF.labs?.length || 0) <= 1) return copy;
      floors[fIndex] = {
        ...currentF,
        noOfLabs: currentF.labs.length - 1,
        labs: currentF.labs.filter((_, idx) => idx !== lIndex),
      };
      copy[bIndex] = { ...currentB, floors };
      return copy;
    });
  };

  const handleUpdateLab = (bIndex, fIndex, lIndex, field, value) => {
    setBuildings((prev) => {
      const copy = [...prev];
      const currentB = copy[bIndex];
      const floors = [...(currentB.floors || [])];
      const currentF = floors[fIndex];
      const labs = [...(currentF.labs || [])];
      labs[lIndex] = { ...labs[lIndex], [field]: value };
      floors[fIndex] = { ...currentF, labs };
      copy[bIndex] = { ...currentB, floors };
      return copy;
    });
  };

  const toggleFloorExpand = (bIndex, fIndex) => {
    const key = `${bIndex}-${fIndex}`;
    setExpandedFloors((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Total summary metrics
  const totalBuildingsCount = buildings.length;
  let totalFloorsCount = 0;
  let totalLabsCount = 0;
  let totalCalculatedNodes = 0;

  buildings.forEach((b) => {
    (b.floors || []).forEach((f) => {
      totalFloorsCount++;
      (f.labs || []).forEach((l) => {
        totalLabsCount++;
        totalCalculatedNodes += parseInt(l.examNodes, 10) || 0;
      });
    });
  });

  const currentBuilding = buildings[activeBuildingIndex] || buildings[0];

  return (
    <div className="submodule-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Status / Rework Banner ── */}
      {isRework && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'var(--color-danger-bg, #fef2f2)',
            border: '1px solid var(--color-danger-border, #fca5a5)',
            color: 'var(--color-danger, #b91c1c)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }}>
              Rework Required for Building & Lab Infrastructure
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              {reworkReason || 'The building layout, lab partition dimensions, or fire/server room specifications require revision.'}
            </div>
          </div>
        </div>
      )}

      {isVerified && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'var(--color-success-bg, #f0fdf4)',
            border: '1px solid var(--color-success-border, #86efac)',
            color: 'var(--color-success, #15803d)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          Building and Examination Lab infrastructure physically audited and verified.
        </div>
      )}

      {/* ── Hierarchy Overview KPIs ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Buildings</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {totalBuildingsCount}
          </div>
        </div>
        <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Exam Floors</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent, #0d9488)' }}>
            {totalFloorsCount}
          </div>
        </div>
        <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total CBT Labs</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalLabsCount}
          </div>
        </div>
        <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Summed Exam Nodes</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>
            {totalCalculatedNodes}
          </div>
        </div>
      </div>

      {/* ── Section A: Common Centre Facilities & Safety Standards (FRD Sec. 9) ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Building2 size={20} color="var(--color-primary, #2563eb)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
              A. Common Campus Facilities & Safety Standards (FRD Sec. 9)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
              Physical entry access, security surveillance, candidate amenities, and fire clearance parameters.
            </span>
          </div>
        </div>

        {uploadError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md, 6px)',
              background: 'var(--color-danger-bg, #fef2f2)',
              border: '1px solid var(--color-danger-border, #fca5a5)',
              color: 'var(--color-danger, #b91c1c)',
              fontSize: '0.8125rem',
              marginBottom: 16,
            }}
          >
            {uploadError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* 1. Gates & Campus Access */}
          <div className="form-group">
            <label className="form-label">Entry Gate Count (1 - 10) *</label>
            <input
              type="number"
              min={1}
              max={10}
              className="form-control"
              value={infrastructure.noOfEntryGates ?? infrastructure.entryGateCount ?? 1}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleInfraChange('noOfEntryGates', val);
                handleInfraChange('entryGateCount', val);
              }}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Exit Gate Count (1 - 10) *</label>
            <input
              type="number"
              min={1}
              max={10}
              className="form-control"
              value={infrastructure.noOfExitGates ?? infrastructure.exitGateCount ?? 1}
              onChange={(e) => {
                const val = Number(e.target.value);
                handleInfraChange('noOfExitGates', val);
                handleInfraChange('exitGateCount', val);
              }}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Separate Entry & Exit Gates?</label>
            <select
              className="form-control"
              value={infrastructure.separateEntryExit ? 'Yes' : 'No'}
              onChange={(e) => handleInfraChange('separateEntryExit', e.target.value === 'Yes')}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes, Dedicated Separate Gates</option>
              <option value="No">No, Shared Single Gate</option>
            </select>
          </div>

          {/* 2. Lift / Elevator */}
          <div className="form-group">
            <label className="form-label">Elevator / Lift Available?</label>
            <select
              className="form-control"
              value={infrastructure.elevatorAvailable ?? infrastructure.liftAvailable ? 'Yes' : 'No'}
              onChange={(e) => {
                const val = e.target.value === 'Yes';
                handleInfraChange('elevatorAvailable', val);
                handleInfraChange('liftAvailable', val);
              }}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes, Operable Lifts Available</option>
              <option value="No">No</option>
            </select>
          </div>

          {(infrastructure.elevatorAvailable ?? infrastructure.liftAvailable) && (
            <div className="form-group">
              <label className="form-label">Number of Lifts Active</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={infrastructure.noOfLifts ?? 1}
                onChange={(e) => handleInfraChange('noOfLifts', Number(e.target.value))}
                disabled={isReadOnly}
              />
            </div>
          )}

          {/* 3. Common Washrooms */}
          <div className="form-group">
            <label className="form-label">Total Common Washrooms</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={infrastructure.totalWashrooms ?? 4}
              onChange={(e) => handleInfraChange('totalWashrooms', Number(e.target.value))}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Male Washrooms</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={infrastructure.maleWashrooms ?? 2}
              onChange={(e) => handleInfraChange('maleWashrooms', Number(e.target.value))}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Female Washrooms</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={infrastructure.femaleWashrooms ?? 2}
              onChange={(e) => handleInfraChange('femaleWashrooms', Number(e.target.value))}
              disabled={isReadOnly}
            />
          </div>

          {/* 4. CCTV Surveillance */}
          <div className="form-group">
            <label className="form-label">Total CCTV Cameras Installed *</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={infrastructure.noOfCctvCameras ?? 16}
              onChange={(e) => handleInfraChange('noOfCctvCameras', Number(e.target.value))}
              disabled={isReadOnly}
            />
          </div>

          {/* 5. Fire Extinguishers */}
          <div className="form-group">
            <label className="form-label">Fire Extinguishers Active Units *</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={infrastructure.noOfFireExtinguishers ?? infrastructure.fireExtinguishers ?? 6}
              onChange={(e) => handleInfraChange('noOfFireExtinguishers', Number(e.target.value))}
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Extinguishers Last Refill Date</label>
            <input
              type="date"
              className="form-control"
              value={
                infrastructure.fireExtinguisherRefillDate
                  ? String(infrastructure.fireExtinguisherRefillDate).split('T')[0]
                  : ''
              }
              onChange={(e) => handleInfraChange('fireExtinguisherRefillDate', e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* ── FRD Facility Checkboxes & Controls ── */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Mandatory FRD Facilities & Compliance Checklist
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {[
              { key: 'drinkingWater', label: 'Clean Drinking Water / RO Stations Available' },
              { key: 'lockerFacility', label: 'Baggage / Locker Counter Available for Candidates' },
              { key: 'parkingAvailable', label: '2-Wheeler Parking Facility Inside Campus' },
              { key: 'candidateParkingInside', label: '4-Wheeler Parking Facility Inside Campus' },
              { key: 'printerAvailable', label: 'Heavy-Duty Laser Printer Available for Attendance & Admit Cards' },
              { key: 'jammerAvailable', label: 'Mobile Signal Jammer Compatible & Installable' },
              { key: 'pwdAccessible', label: 'PWD Barrier-Free Access (Ramps / Wide Doors)' },
              { key: 'wheelchairAvailable', label: 'Wheelchair Available Onsite for PWD Candidates' },
              { key: 'suitablePwd', label: 'Dedicated Accessible PWD Washroom Available' },
              { key: 'dedicatedServerRoom', label: 'Dedicated Lockable Server Room with AC & UPS' },
              { key: 'acInServerRoom', label: 'Dedicated AC Functioning in Server Room' },
              { key: 'serverRoomUpsNetwork', label: 'Server Room on Dedicated UPS Backup' },
              { key: 'firstAidAvailable', label: 'First Aid Kit & Emergency Medical Assistance Onsite' },
              { key: 'emergencyExitsMarked', label: 'Clear Illuminated Emergency Exit Signages Marked' },
              { key: 'fireSafetyClearance', label: 'Fire Safety NOC / Clearance Available' },
            ].map((chk) => (
              <label
                key={chk.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md, 6px)',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  cursor: isReadOnly ? 'default' : 'pointer',
                  fontSize: '0.8125rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(infrastructure[chk.key])}
                  onChange={(e) => handleInfraChange(chk.key, e.target.checked)}
                  disabled={isReadOnly}
                />
                {chk.label}
              </label>
            ))}
          </div>
        </div>

        {/* ── Photo & Attachment Upload Row ── */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Facility Photos & Fire NOC Documentation (FRD Sec. 9)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {[
              { type: 'gate_photo', name: 'Campus Entry Gate Photo', isPhoto: true },
              { type: 'server_room_photo', name: 'Server Room Photo', isPhoto: true },
              { type: 'water_station_photo', name: 'RO Drinking Water Photo', isPhoto: true },
              { type: 'pwd_ramp_photo', name: 'PWD Ramp & Wheelchair Photo', isPhoto: true },
              { type: 'fire_noc', name: 'Fire NOC Certificate (PDF ≤ 10MB)', isPhoto: false },
            ].map((item) => {
              const doc = getDoc(item.type);
              return (
                <div
                  key={item.type}
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius-md, 6px)',
                    background: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.8125rem', display: 'block' }}>{item.name}</strong>
                    {doc ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Check size={12} /> {doc.fileName || 'Uploaded'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Not uploaded</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {doc && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-xs btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
                      >
                        <Eye size={11} /> View
                      </a>
                    )}
                    {!isReadOnly && (
                      <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                        <Upload size={11} className={uploadingDoc === item.type ? 'animate-spin' : ''} />
                        {uploadingDoc === item.type ? '...' : doc ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          accept={item.isPhoto ? '.jpg,.jpeg,image/jpeg' : '.pdf,application/pdf,.jpg,.jpeg,image/jpeg'}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], item.type, item.name, item.isPhoto);
                            }
                          }}
                          disabled={uploadingDoc === item.type}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section B: Nested Building -> Floor -> Lab Tree ── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={20} color="var(--color-primary, #2563eb)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                B. Nested Building → Floor → Lab Configuration
              </h3>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
                Map all exam rooms, seating nodes, and partition specifications hierarchy.
              </span>
            </div>
          </div>

          {!isReadOnly && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleAddBuilding}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Add New Building
              </button>
              {onSaveAndAddBuilding && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={onSaveAndAddBuilding}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> Save & Add New Building
                </button>
              )}
            </div>
          )}
        </div>

        {/* Building Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            marginBottom: 20,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {buildings.map((b, bIdx) => (
            <button
              key={bIdx}
              type="button"
              className={`btn btn-sm ${activeBuildingIndex === bIdx ? 'btn-primary' : 'btn-subtle'}`}
              onClick={() => setActiveBuildingIndex(bIdx)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Building2 size={13} />
              {b.buildingName || `Building ${bIdx + 1}`}
            </button>
          ))}
        </div>

        {/* Current Active Building Editor */}
        {currentBuilding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Building Metadata Header */}
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                  Building Details: {currentBuilding.buildingName}
                </h4>
                {buildings.length > 1 && !isReadOnly && (
                  <button
                    type="button"
                    className="btn btn-xs btn-danger"
                    onClick={() => handleDeleteBuilding(activeBuildingIndex)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Trash2 size={12} /> Delete Building
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Building Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentBuilding.buildingName || ''}
                    onChange={(e) => handleUpdateBuilding(activeBuildingIndex, 'buildingName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Block A / Science Wing"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Floors</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={currentBuilding.noOfFloors || currentBuilding.floors?.length || 1}
                    onChange={(e) => handleUpdateBuilding(activeBuildingIndex, 'noOfFloors', Number(e.target.value))}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Entry Gates</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={currentBuilding.entryGateCount ?? 1}
                    onChange={(e) => handleUpdateBuilding(activeBuildingIndex, 'entryGateCount', Number(e.target.value))}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Exit Gates</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={currentBuilding.exitGateCount ?? 1}
                    onChange={(e) => handleUpdateBuilding(activeBuildingIndex, 'exitGateCount', Number(e.target.value))}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lifts Available?</label>
                  <select
                    className="form-control"
                    value={currentBuilding.liftAvailable ? 'Yes' : 'No'}
                    onChange={(e) => handleUpdateBuilding(activeBuildingIndex, 'liftAvailable', e.target.value === 'Yes')}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Floors List in Active Building */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Floors in {currentBuilding.buildingName} ({(currentBuilding.floors || []).length})
                </h4>
                {!isReadOnly && (
                  <button
                    type="button"
                    className="btn btn-xs btn-secondary"
                    onClick={() => handleAddFloor(activeBuildingIndex)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={12} /> Add New Floor
                  </button>
                )}
              </div>

              {(currentBuilding.floors || []).map((floor, fIdx) => {
                const floorKey = `${activeBuildingIndex}-${fIdx}`;
                const isFloorExpanded = expandedFloors[floorKey] !== false; // default open

                return (
                  <div
                    key={fIdx}
                    style={{
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: 'var(--radius-md, 8px)',
                      background: 'var(--bg-surface)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Floor Header Bar */}
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-subtle, #f1f5f9)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleFloorExpand(activeBuildingIndex, fIdx)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isFloorExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                          {floor.floorName} ({(floor.labs || []).length} Labs)
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        {!isReadOnly && (
                          <>
                            <button
                              type="button"
                              className="btn btn-xs btn-secondary"
                              onClick={() => handleAddLab(activeBuildingIndex, fIdx)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Plus size={11} /> Add New Lab
                            </button>
                            {(currentBuilding.floors || []).length > 1 && (
                              <button
                                type="button"
                                className="btn btn-xs btn-subtle"
                                onClick={() => handleDeleteFloor(activeBuildingIndex, fIdx)}
                                title="Delete Floor"
                              >
                                <Trash2 size={12} color="var(--color-danger)" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Floor Expanded Details & Labs */}
                    {isFloorExpanded && (
                      <div style={{ padding: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Floor Label</label>
                            <input
                              type="text"
                              className="form-control"
                              value={floor.floorName}
                              onChange={(e) => handleUpdateFloor(activeBuildingIndex, fIdx, 'floorName', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Washrooms on Floor</label>
                            <input
                              type="number"
                              min={0}
                              className="form-control"
                              value={floor.totalWashrooms ?? 2}
                              onChange={(e) => handleUpdateFloor(activeBuildingIndex, fIdx, 'totalWashrooms', Number(e.target.value))}
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>PWD Ramp/Lift Access?</label>
                            <select
                              className="form-control"
                              value={floor.rampOrLiftAccess ? 'Yes' : 'No'}
                              onChange={(e) => handleUpdateFloor(activeBuildingIndex, fIdx, 'rampOrLiftAccess', e.target.value === 'Yes')}
                              disabled={isReadOnly}
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        </div>

                        {/* Labs Inside Floor */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <h5 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Labs in {floor.floorName}
                          </h5>

                          {(floor.labs || []).map((lab, lIdx) => (
                            <div
                              key={lIdx}
                              style={{
                                padding: 14,
                                borderRadius: 'var(--radius-md, 6px)',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                background: '#fafbfc',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Monitor size={15} color="var(--color-primary)" />
                                  <strong style={{ fontSize: '0.875rem' }}>{lab.labName}</strong>
                                  <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>
                                    {lab.examNodes} Exam Nodes
                                  </span>
                                </div>
                                {!isReadOnly && (floor.labs || []).length > 1 && (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-subtle"
                                    onClick={() => handleDeleteLab(activeBuildingIndex, fIdx, lIdx)}
                                    title="Delete Lab"
                                  >
                                    <Trash2 size={12} color="var(--color-danger)" />
                                  </button>
                                )}
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Lab Name *</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={lab.labName}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'labName', e.target.value)}
                                    disabled={isReadOnly}
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Lab Type</label>
                                  <select
                                    className="form-control"
                                    value={lab.labType || 'Dedicated CBT Lab'}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'labType', e.target.value)}
                                    disabled={isReadOnly}
                                  >
                                    {LAB_TYPES.map((lt) => (
                                      <option key={lt} value={lt}>{lt}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Total Nodes *</label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-control"
                                    value={lab.totalNodes}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'totalNodes', Number(e.target.value))}
                                    disabled={isReadOnly}
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Exam Nodes *</label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-control"
                                    value={lab.examNodes}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'examNodes', Number(e.target.value))}
                                    disabled={isReadOnly}
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Working Nodes</label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-control"
                                    value={lab.workingNodes ?? lab.totalNodes}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'workingNodes', Number(e.target.value))}
                                    disabled={isReadOnly}
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Adjacent Distance (ft)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min={1}
                                    className="form-control"
                                    value={lab.adjacentComputerDistanceFt ?? 2.0}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'adjacentComputerDistanceFt', Number(e.target.value))}
                                    disabled={isReadOnly}
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Partition Available?</label>
                                  <select
                                    className="form-control"
                                    value={lab.partitionAvailable ? 'Yes' : 'No'}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'partitionAvailable', e.target.value === 'Yes')}
                                    disabled={isReadOnly}
                                  >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Partition Material</label>
                                  <select
                                    className="form-control"
                                    value={lab.partitionType || 'Wood'}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'partitionType', e.target.value)}
                                    disabled={isReadOnly || !lab.partitionAvailable}
                                  >
                                    {PARTITION_TYPES.map((pt) => (
                                      <option key={pt} value={pt}>{pt}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>System Ownership</label>
                                  <select
                                    className="form-control"
                                    value={lab.systemOwnership || 'Owned'}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'systemOwnership', e.target.value)}
                                    disabled={isReadOnly}
                                  >
                                    {SYSTEM_OWNERSHIP_TYPES.map((so) => (
                                      <option key={so} value={so}>{so}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="form-group">
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>CCTV Units in Lab</label>
                                  <input
                                    type="number"
                                    min={0}
                                    className="form-control"
                                    value={lab.cctvCount ?? 2}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'cctvCount', Number(e.target.value))}
                                    disabled={isReadOnly}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, fontSize: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(lab.canFormatSystems)}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'canFormatSystems', e.target.checked)}
                                    disabled={isReadOnly}
                                  />
                                  Can Format Systems for Exam
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(lab.canChangeIp)}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'canChangeIp', e.target.checked)}
                                    disabled={isReadOnly}
                                  />
                                  Can Change Static IP Addresses
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(lab.pwdSuitable)}
                                    onChange={(e) => handleUpdateLab(activeBuildingIndex, fIdx, lIdx, 'pwdSuitable', e.target.checked)}
                                    disabled={isReadOnly}
                                  />
                                  PWD Candidate Suitable Lab
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Submodule4BuildingInfra;

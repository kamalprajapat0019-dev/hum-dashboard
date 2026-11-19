import React from 'react';
import { BUILDING_TYPES } from './constants';

export function Step4Building({ building, setBuilding, isReadOnly }) {
  return (
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
  );
}

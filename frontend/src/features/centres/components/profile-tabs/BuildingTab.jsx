import React from 'react';

export function BuildingTab({ inf }) {
  return (
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
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, Plus, Truck, CheckCircle2, 
  AlertTriangle, Clock, ShieldCheck, Box, RefreshCw, X, ArrowUpRight
} from 'lucide-react';
import { InventoryStore, CentreStore, ProjectStore, appendAuditLog } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [centres, setCentres] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dispatch Asset Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    item_name: '4G/5G All-Band Cellular Jammer',
    serial_no: `JAM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    centre_id: '',
    project_id: '',
    custodian: 'Centre TCA / Venue Head'
  });

  const loadData = () => {
    setInventory(InventoryStore.getAll());
    setCentres(CentreStore.getAll());
    setProjects(ProjectStore.getAll());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleDispatch = (e) => {
    e.preventDefault();
    const centre = centres.find(c => c.id === dispatchForm.centre_id);
    const proj = projects.find(p => p.id === dispatchForm.project_id);
    if (!centre || !proj) {
      alert('Please select both Centre and Project');
      return;
    }

    const newAsset = {
      id: `inv_${Date.now()}`,
      item_name: dispatchForm.item_name,
      serial_no: dispatchForm.serial_no,
      centre_name: centre.name,
      project_name: proj.name,
      status: 'In Transit',
      custodian: dispatchForm.custodian,
      dispatched_at: new Date().toISOString()
    };

    InventoryStore.create(newAsset);
    appendAuditLog({
      module: 'Inventory & Logistics',
      action: 'Asset Dispatched',
      record_ref: newAsset.serial_no,
      user_id: user?.email || 'ops@oemportal.in',
      details: `Dispatched ${newAsset.item_name} (${newAsset.serial_no}) to ${centre.name} for ${proj.name}.`
    });

    loadData();
    setModalOpen(false);
  };

  const handleUpdateAssetStatus = (assetId, newStatus) => {
    const asset = inventory.find(i => i.id === assetId);
    if (!asset) return;

    InventoryStore.update(assetId, {
      status: newStatus
    });

    appendAuditLog({
      module: 'Inventory & Logistics',
      action: `Asset Status: ${newStatus}`,
      record_ref: asset.serial_no,
      user_id: user?.email || 'ops@oemportal.in',
      details: `Asset ${asset.item_name} (${asset.serial_no}) updated to ${newStatus}.`
    });

    loadData();
  };

  const filteredInventory = inventory.filter(i => {
    const matchSearch = i.item_name.toLowerCase().includes(search.toLowerCase()) ||
                        i.serial_no.toLowerCase().includes(search.toLowerCase()) ||
                        i.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        i.custodian.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpis = {
    total: inventory.length,
    active: inventory.filter(i => i.status.includes('Active')).length,
    inTransit: inventory.filter(i => i.status.includes('Transit')).length,
    returned: inventory.filter(i => i.status.includes('Returned') || i.status.includes('Warehouse')).length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Package size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Logistics & Exam Security Equipment Inventory
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Dispatch tracking for cellular jammers, biometric terminals, handheld metal detectors, and CBT exam servers
              </p>
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} /> Dispatch Asset to Centre
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL TRACKED ASSETS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{kpis.total}</div>
          <div style={{ fontSize: 12, color: '#0891b2', marginTop: 4 }}>Serialized Hardware Units</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>DEPLOYED & ACTIVE</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.active}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Online at examination venues</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>IN TRANSIT / DISPATCHED</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#d97706' }}>{kpis.inTransit}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Courier / Field Squad en route</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>WAREHOUSE / RETURNED</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#7c3aed' }}>{kpis.returned}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Available for reallocation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by asset name, serial number, venue name, custodian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-tertiary)' }} />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <option value="ALL">All Status</option>
            <option value="Deployed & Active">Deployed & Active</option>
            <option value="In Transit">In Transit</option>
            <option value="Warehouse / Returned">Warehouse / Returned</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Equipment Name</th>
                <th style={{ padding: '12px 16px' }}>Serial Number</th>
                <th style={{ padding: '12px 16px' }}>Assigned Venue</th>
                <th style={{ padding: '12px 16px' }}>Exam Project</th>
                <th style={{ padding: '12px 16px' }}>Custodian In-Charge</th>
                <th style={{ padding: '12px 16px' }}>Logistics Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                    No inventory records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isActive = item.status.includes('Active');
                  const isTransit = item.status.includes('Transit');

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.item_name}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 13, color: '#0891b2' }}>
                        {item.serial_no}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-primary)' }}>
                        {item.centre_name}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-info">{item.project_name}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {item.custodian}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge ${
                          isActive ? 'badge-success' : 
                          isTransit ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {isTransit ? (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateAssetStatus(item.id, 'Deployed & Active')}
                            style={{ fontSize: 11 }}
                          >
                            Mark Delivered
                          </button>
                        ) : (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateAssetStatus(item.id, 'Warehouse / Returned')}
                            style={{ fontSize: 11 }}
                          >
                            Return to Base
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH ASSET MODAL */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleDispatch} className="card" style={{
            width: '100%', maxWidth: 520, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Dispatch Security Equipment to Venue
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Equipment Type *
              </label>
              <select 
                value={dispatchForm.item_name}
                onChange={(e) => setDispatchForm({ ...dispatchForm, item_name: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              >
                <option value="4G/5G All-Band Cellular Jammer">4G/5G All-Band Cellular Jammer</option>
                <option value="Biometric Iris & Fingerprint Terminal">Biometric Iris & Fingerprint Terminal</option>
                <option value="Handheld Metal Detector (HHMD)">Handheld Metal Detector (HHMD)</option>
                <option value="8TB CBT Exam NVR Storage Server">8TB CBT Exam NVR Storage Server</option>
                <option value="High-Speed Duplex Barcode Scanner">High-Speed Duplex Barcode Scanner</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Serial Number *
              </label>
              <input 
                type="text"
                value={dispatchForm.serial_no}
                onChange={(e) => setDispatchForm({ ...dispatchForm, serial_no: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Destination Centre *
                </label>
                <select 
                  value={dispatchForm.centre_id}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, centre_id: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Choose Centre...</option>
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Exam Project *
                </label>
                <select 
                  value={dispatchForm.project_id}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, project_id: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Choose Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Custodian In-Charge at Venue *
              </label>
              <input 
                type="text"
                value={dispatchForm.custodian}
                onChange={(e) => setDispatchForm({ ...dispatchForm, custodian: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Dispatch Equipment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

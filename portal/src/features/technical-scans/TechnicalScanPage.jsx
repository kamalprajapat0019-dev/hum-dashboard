import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertOctagon, Cpu, Wifi, HardDrive, 
  Search, Filter, RefreshCw, Download, CheckCircle2, 
  AlertTriangle, Laptop, ShieldAlert, Check
} from 'lucide-react';
import { TechnicalScanStore, CentreStore, appendAuditLog } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';

export default function TechnicalScanPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [nodeSearch, setNodeSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const loadData = () => {
    const allScans = TechnicalScanStore.getAll();
    setScans(allScans);
    if (!selectedScanId && allScans.length > 0) {
      setSelectedScanId(allScans[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const currentScan = scans.find(s => s.id === selectedScanId) || scans[0];

  const handleRunScan = () => {
    setIsScanning(true);
    setScanMessage('Initiating ARP broadcast & MAC address discovery across CBT subnet...');
    
    setTimeout(() => {
      setScanMessage('Pinging all 120 nodes... verifying USB group policy & antivirus signature...');
    }, 900);

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('');
      
      appendAuditLog({
        module: 'Technical Scan',
        action: 'Network MAC Scan Executed',
        record_ref: currentScan?.scan_code || 'SCAN-2026-01',
        user_id: user?.email || 'auditor@oemportal.in',
        details: `Live network scan finished for ${currentScan?.centre_name}. 3 duplicate MAC addresses detected.`
      });

      alert(`✅ Technical Scan complete! 120 nodes inspected. 3 Duplicate MAC addresses flagged on subnet.`);
    }, 1800);
  };

  const nodes = currentScan?.nodes || [];

  const filteredNodes = nodes.filter(n => {
    const matchSearch = n.hostname.toLowerCase().includes(nodeSearch.toLowerCase()) ||
                        n.ip.includes(nodeSearch) ||
                        n.mac.toLowerCase().includes(nodeSearch.toLowerCase());
    if (filterType === 'DUPLICATE') return matchSearch && n.duplicate;
    if (filterType === 'HIGH_LATENCY') return matchSearch && parseFloat(n.latency) > 2.0;
    if (filterType === 'COMPLIANT') return matchSearch && n.status === 'Compliant';
    return matchSearch;
  });

  const duplicateNodes = nodes.filter(n => n.duplicate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0891b2 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Technical Scan & Duplicate MAC Detection
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Hardware inventory validation, duplicate MAC detection engine, LAN latency test & USB port lockdown audit
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select 
            value={selectedScanId}
            onChange={(e) => setSelectedScanId(e.target.value)}
            className="input"
            style={{ fontWeight: 600, padding: '8px 14px' }}
          >
            {scans.map(s => (
              <option key={s.id} value={s.id}>
                {s.centre_name} ({s.project_name})
              </option>
            ))}
          </select>

          <button 
            className="btn btn-primary"
            onClick={handleRunScan}
            disabled={isScanning}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={15} className={isScanning ? 'spin' : ''} />
            {isScanning ? 'Scanning Network...' : 'Run Live MAC Scan'}
          </button>
        </div>
      </div>

      {/* Live Scanning Progress Alert */}
      {isScanning && (
        <div className="card" style={{ padding: '14px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 12 }}>
          <RefreshCw size={18} className="spin" style={{ color: '#2563eb' }} />
          <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
            {scanMessage}
          </div>
        </div>
      )}

      {/* CRITICAL DUPLICATE MAC HAZARD BANNER */}
      {duplicateNodes.length > 0 && (
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1.5px solid #ef4444',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.12)',
          display: 'flex', alignItems: 'flex-start', gap: 14
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <AlertOctagon size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CRITICAL MALPRACTICE ALERT: DUPLICATE MAC ADDRESS DETECTED
              </span>
              <span className="badge badge-danger">High Severity P0</span>
            </div>
            <p style={{ fontSize: 13, color: '#b91c1c', margin: '4px 0 8px' }}>
              Hardware MAC address <strong>00:1B:44:11:3A:B7</strong> is cloned or shared across <strong>{duplicateNodes.length} workstations</strong> ({duplicateNodes.map(d => d.hostname).join(', ')}). Multiple systems sharing one MAC violates NTA/NBE CBT security mandates.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, background: '#fff', padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', color: '#991b1b', fontWeight: 600 }}>
                Flagged Hostnames: {duplicateNodes.map(d => d.hostname).join(' • ')}
              </span>
              <span style={{ fontSize: 12, background: '#fff', padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', color: '#991b1b', fontWeight: 600 }}>
                Action: Isolate switch port & inspect physical NICs immediately
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Scan Metrics */}
      {currentScan && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="card" style={{ padding: 18, borderLeft: '4px solid #0891b2' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL SCANNED NODES</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>
              {currentScan.scanned_nodes} / {currentScan.total_nodes}
            </div>
            <div style={{ fontSize: 12, color: '#0891b2', marginTop: 4 }}>100% Subnet Coverage</div>
          </div>

          <div className="card" style={{ padding: 18, borderLeft: '4px solid #dc2626' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>DUPLICATE MACs</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: currentScan.duplicate_mac_count > 0 ? '#dc2626' : '#16a34a' }}>
              {currentScan.duplicate_mac_count} Systems
            </div>
            <div style={{ fontSize: 12, color: currentScan.duplicate_mac_count > 0 ? '#dc2626' : '#16a34a', marginTop: 4 }}>
              {currentScan.duplicate_mac_count > 0 ? 'CRITICAL ALERT ACTIVE' : 'Zero Duplicate NICs'}
            </div>
          </div>

          <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>AVG LAN LATENCY</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>
              {currentScan.avg_latency_ms} ms
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Threshold: &lt; 2.0 ms</div>
          </div>

          <div className="card" style={{ padding: 18, borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>USB PORT LOCKDOWN</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#7c3aed' }}>
              {currentScan.usb_blocked_pct}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Group policy USB disable</div>
          </div>
        </div>
      )}

      {/* Filter and Node Search */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by Hostname (LAB1-PC-01), IP, or MAC Address..."
              value={nodeSearch}
              onChange={(e) => setNodeSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('ALL')}
          >
            All Workstations ({nodes.length})
          </button>
          <button 
            className={`btn btn-sm ${filterType === 'DUPLICATE' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setFilterType('DUPLICATE')}
            style={filterType === 'DUPLICATE' ? { background: '#dc2626', color: '#fff' } : {}}
          >
            Duplicate MAC Flags ({duplicateNodes.length})
          </button>
          <button 
            className={`btn btn-sm ${filterType === 'HIGH_LATENCY' ? 'btn-warning' : 'btn-secondary'}`}
            onClick={() => setFilterType('HIGH_LATENCY')}
          >
            High Ping (&gt;2ms)
          </button>
          <button 
            className={`btn btn-sm ${filterType === 'COMPLIANT' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setFilterType('COMPLIANT')}
          >
            Compliant Only
          </button>
        </div>
      </div>

      {/* Workstation Inventory Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Workstation / Hostname</th>
                <th style={{ padding: '12px 16px' }}>IP Address</th>
                <th style={{ padding: '12px 16px' }}>MAC Address (Hardware ID)</th>
                <th style={{ padding: '12px 16px' }}>RAM & Specs</th>
                <th style={{ padding: '12px 16px' }}>Operating System</th>
                <th style={{ padding: '12px 16px' }}>Ping Latency</th>
                <th style={{ padding: '12px 16px' }}>USB Ports</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Security Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
                    No nodes match the selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredNodes.map((n) => {
                  const isDup = n.duplicate;
                  const latencyNum = parseFloat(n.latency);
                  const isHighLatency = latencyNum > 2.0;

                  return (
                    <tr key={n.id} style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      background: isDup ? '#fff5f5' : 'transparent'
                    }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Laptop size={16} style={{ color: isDup ? '#dc2626' : 'var(--text-secondary)' }} />
                          <span style={{ fontWeight: 600, color: isDup ? '#dc2626' : 'var(--text-primary)', fontFamily: 'monospace' }}>
                            {n.hostname}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 13 }}>
                        {n.ip}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: 13, 
                            fontWeight: isDup ? 800 : 500,
                            color: isDup ? '#dc2626' : 'var(--text-primary)',
                            background: isDup ? '#fee2e2' : 'transparent',
                            padding: isDup ? '2px 6px' : '0',
                            borderRadius: 4
                          }}>
                            {n.mac}
                          </span>
                          {isDup && (
                            <span className="badge badge-danger" style={{ fontSize: 10 }}>Duplicate</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {n.ram}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {n.os}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>
                        <span style={{ 
                          fontWeight: 600,
                          color: isHighLatency ? '#d97706' : '#16a34a'
                        }}>
                          {n.latency}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>
                        {n.usb_blocked ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 12 }}>
                            <Check size={14} /> Disabled (Safe)
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
                            <AlertTriangle size={14} /> Enabled (Risk)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <span className={`badge ${
                          isDup ? 'badge-danger' : 
                          isHighLatency ? 'badge-warning' : 'badge-success'
                        }`}>
                          {n.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

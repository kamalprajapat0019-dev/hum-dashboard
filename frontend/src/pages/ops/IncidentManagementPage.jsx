import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Search, Filter, AlertTriangle, AlertOctagon, 
  Clock, CheckCircle2, MessageSquare, Send, Plus, 
  ShieldAlert, Box, Package, RefreshCw, X
} from 'lucide-react';
import { IncidentStore, InventoryStore, CentreStore, ProjectStore, appendAuditLog } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

export default function IncidentManagementPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [centres, setCentres] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals & Drawers
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Ticket Form
  const [newTicket, setNewTicket] = useState({
    centre_id: '',
    project_id: '',
    title: '',
    category: 'Network & Security',
    priority: 'P0 Critical',
    initial_note: ''
  });

  const loadData = () => {
    setIncidents(IncidentStore.getAll());
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

  const handleUpdateStatus = (ticketId, newStatus) => {
    const inc = incidents.find(i => i.id === ticketId);
    if (!inc) return;

    IncidentStore.update(ticketId, {
      status: newStatus
    });

    appendAuditLog({
      module: 'Incident Management',
      action: `Ticket Status: ${newStatus}`,
      record_ref: inc.ticket_code,
      user_id: user?.email || 'ops@oemportal.in',
      details: `Incident "${inc.title}" moved to ${newStatus}.`
    });

    loadData();
    if (selectedIncident && selectedIncident.id === ticketId) {
      setSelectedIncident({ ...selectedIncident, status: newStatus });
    }
  };

  const handleAddMessage = (e) => {
    e.preventDefault();
    if (!replyText || !selectedIncident) return;

    const newMsg = {
      sender: `${user?.name || 'Operations'} (${user?.role || 'Ops'})`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: replyText
    };

    const updatedMsgs = [...(selectedIncident.messages || []), newMsg];
    IncidentStore.update(selectedIncident.id, {
      messages: updatedMsgs
    });

    setSelectedIncident({ ...selectedIncident, messages: updatedMsgs });
    setReplyText('');
    loadData();
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const centre = centres.find(c => c.id === newTicket.centre_id);
    const proj = projects.find(p => p.id === newTicket.project_id);
    if (!centre || !proj || !newTicket.title) {
      alert('Please fill all mandatory fields');
      return;
    }

    const createdTicket = {
      id: `inc_${Date.now()}`,
      ticket_code: `INC-2026-${String(incidents.length + 1).padStart(3, '0')}`,
      project_name: proj.name,
      centre_id: centre.id,
      centre_name: centre.name,
      city: centre.city || 'Delhi NCR',
      title: newTicket.title,
      category: newTicket.category,
      priority: newTicket.priority,
      sla_mins_remaining: newTicket.priority === 'P0 Critical' ? 30 : 60,
      reporter: user?.name || 'Operations Desk',
      owner: 'Operations Team Lead',
      status: 'Open',
      created_at: new Date().toISOString(),
      messages: [
        {
          sender: user?.name || 'Operations Desk',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: newTicket.initial_note || newTicket.title
        }
      ]
    };

    IncidentStore.create(createdTicket);
    appendAuditLog({
      module: 'Incident Management',
      action: 'Incident Created',
      record_ref: createdTicket.ticket_code,
      user_id: user?.email || 'ops@oemportal.in',
      details: `New incident raised: ${createdTicket.title} (${createdTicket.priority})`
    });

    loadData();
    setCreateModalOpen(false);
  };

  const filteredIncidents = incidents.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
                        i.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
                        i.centre_name.toLowerCase().includes(search.toLowerCase()) ||
                        i.category.toLowerCase().includes(search.toLowerCase());
    const matchPri = priorityFilter === 'ALL' || i.priority === priorityFilter;
    return matchSearch && matchPri;
  });

  const kpis = {
    total: incidents.length,
    critical: incidents.filter(i => i.priority === 'P0 Critical' && i.status !== 'Resolved').length,
    open: incidents.filter(i => i.status === 'Open' || i.status === 'Investigating').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Incident Command & SLA Ticketing Engine
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Real-time incident resolution, 30-min P0 SLA countdowns, live clarification threads, and emergency escalation
              </p>
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dc2626' }}
        >
          <Plus size={16} /> Log Urgent Incident
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL INCIDENT TICKETS</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{kpis.total}</div>
          <div style={{ fontSize: 12, color: '#0891b2', marginTop: 4 }}>Across active examination centres</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>P0 CRITICAL OPEN</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#dc2626' }}>{kpis.critical}</div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>30-Min SLA Resolution Target</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>INVESTIGATING / OPEN</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#d97706' }}>{kpis.open}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Under operations action</div>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>RESOLVED & CLOSED</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#16a34a' }}>{kpis.resolved}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Verified normal service</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search by ticket code, centre name, issue title..."
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
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="P0 Critical">P0 Critical</option>
            <option value="P1 High">P1 High</option>
            <option value="P2 Medium">P2 Medium</option>
            <option value="P3 Low">P3 Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Incident Tickets + Details Thread */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedIncident ? '1.1fr 1.2fr' : '1fr', gap: 20 }}>
        {/* Incident Tickets List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredIncidents.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No incidents found.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isCrit = inc.priority === 'P0 Critical';
              const isResolved = inc.status === 'Resolved';
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div 
                  key={inc.id}
                  className="card"
                  onClick={() => setSelectedIncident(inc)}
                  style={{
                    padding: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    borderLeft: `5px solid ${isCrit ? '#dc2626' : '#f59e0b'}`,
                    background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
                    borderColor: isSelected ? '#0891b2' : 'var(--border-color)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${isCrit ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                        {inc.priority}
                      </span>
                      <span className="badge badge-info">{inc.category}</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {inc.ticket_code}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                      {inc.title}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {inc.centre_name} • {inc.project_name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                    <span style={{ 
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: inc.sla_mins_remaining === 0 ? '#dc2626' : inc.sla_mins_remaining <= 20 ? '#d97706' : '#16a34a',
                      fontWeight: 700 
                    }}>
                      <Clock size={13} /> SLA: {inc.sla_mins_remaining}m remaining
                    </span>

                    <span className={`badge ${
                      isResolved ? 'badge-success' : 
                      inc.status === 'Escalated to PM' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Incident Conversation Thread */}
        {selectedIncident && (
          <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-info">{selectedIncident.ticket_code}</span>
                  <span className={`badge ${selectedIncident.priority === 'P0 Critical' ? 'badge-danger' : 'badge-warning'}`}>
                    {selectedIncident.priority}
                  </span>
                  <span className="badge badge-neutral">{selectedIncident.status}</span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
                  {selectedIncident.title}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {selectedIncident.centre_name} | Reported by {selectedIncident.reporter}
                </div>
              </div>

              <button onClick={() => setSelectedIncident(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Quick Transition Action Bar */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Action:</span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleUpdateStatus(selectedIncident.id, 'Investigating')}
                style={{ fontSize: 11 }}
              >
                Mark Investigating
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleUpdateStatus(selectedIncident.id, 'Escalated to PM')}
                style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}
              >
                Escalate to PM
              </button>
              <button 
                className="btn btn-success btn-sm"
                onClick={() => handleUpdateStatus(selectedIncident.id, 'Resolved')}
                style={{ fontSize: 11, background: '#16a34a', color: '#fff' }}
              >
                Resolve Ticket
              </button>
            </div>

            {/* Messages Stream */}
            <div style={{ 
              display: 'flex', flexDirection: 'column', gap: 12, 
              maxHeight: 380, overflowY: 'auto', padding: 12, 
              background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)' 
            }}>
              {selectedIncident.messages?.map((msg, i) => (
                <div key={i} style={{ 
                  padding: 10, borderRadius: 8, background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{msg.sender}</strong>
                    <span style={{ color: 'var(--text-tertiary)' }}>{msg.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{msg.text}</div>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleAddMessage} style={{ display: 'flex', gap: 10 }}>
              <input 
                type="text"
                placeholder="Post clarification or update..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 5D. Inventory & Hardware Assets Tracker */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Package size={20} style={{ color: '#0891b2' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Exam Logistics & Security Inventory Deployment (Jammers, Biometrics & HHMD)
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 14px' }}>Asset Name</th>
                <th style={{ padding: '10px 14px' }}>Serial Number</th>
                <th style={{ padding: '10px 14px' }}>Deployed Venue</th>
                <th style={{ padding: '10px 14px' }}>Project</th>
                <th style={{ padding: '10px 14px' }}>Custodian</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Dispatch Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{inv.item_name}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12 }}>{inv.serial_no}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>{inv.centre_name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}><span className="badge badge-info">{inv.project_name}</span></td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{inv.custodian}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <span className="badge badge-success">{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {createModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <form onSubmit={handleCreateTicket} className="card" style={{
            width: '100%', maxWidth: 540, padding: 24, borderRadius: 16,
            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Raise Incident Ticket
              </h2>
              <button type="button" onClick={() => setCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Incident Title *
              </label>
              <input 
                type="text"
                placeholder="e.g. DG fuel pump tripped, switch port packet drop..."
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Examination Centre *
                </label>
                <select 
                  value={newTicket.centre_id}
                  onChange={(e) => setNewTicket({ ...newTicket, centre_id: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Choose Centre...</option>
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Exam Project *
                </label>
                <select 
                  value={newTicket.project_id}
                  onChange={(e) => setNewTicket({ ...newTicket, project_id: e.target.value })}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Priority Level *
                </label>
                <select 
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="P0 Critical">P0 Critical (30m SLA)</option>
                  <option value="P1 High">P1 High (60m SLA)</option>
                  <option value="P2 Medium">P2 Medium</option>
                  <option value="P3 Low">P3 Low</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Category *
                </label>
                <select 
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="Network & Security">Network & Security</option>
                  <option value="Power Redundancy">Power Redundancy</option>
                  <option value="Hardware & Peripherals">Hardware & Peripherals</option>
                  <option value="Candidate Malpractice">Candidate Malpractice</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Initial Situation & Evidence Note
              </label>
              <textarea 
                rows={3}
                value={newTicket.initial_note}
                onChange={(e) => setNewTicket({ ...newTicket, initial_note: e.target.value })}
                className="input"
                style={{ width: '100%' }}
                placeholder="Describe current impact on exam candidates, symptoms observed..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: '#dc2626' }}>
                Dispatch Incident Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

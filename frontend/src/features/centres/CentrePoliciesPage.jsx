import React from 'react';
import { ShieldCheck, FileText, Download, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';

const POLICIES_LIST = [
  {
    id: 'pol-01',
    title: 'Standard Operating Procedure (SOP) for CBT Examination Venues',
    category: 'Examination Conduct',
    version: 'v2026.3',
    effectiveDate: '01 Nov 2026',
    description: 'Mandatory operational guidelines governing candidate frisking, biometric verification, lab readiness checks, and server room access controls.',
    mandatory: true,
  },
  {
    id: 'pol-02',
    title: 'IT & Network Infrastructure Security Protocol',
    category: 'Cybersecurity',
    version: 'v2026.1',
    effectiveDate: '15 Oct 2026',
    description: 'Technical requirements for dual ISP failover, 1 Gbps Gigabit core switching, secure client lockdown, IP scanning compliance, and local LAN isolation.',
    mandatory: true,
  },
  {
    id: 'pol-03',
    title: 'Uninterrupted Power Supply (UPS) & DG Set Failover Standard',
    category: 'Infrastructure',
    version: 'v2026.2',
    effectiveDate: '20 Oct 2026',
    description: 'Standard guidelines on mandatory online UPS backup duration, AMF auto-switchover panels, on-site certified electrician SLAs, and reserve diesel storage.',
    mandatory: true,
  },
  {
    id: 'pol-04',
    title: 'Non-Disclosure & Confidentiality Undertaking (NDA) Policy',
    category: 'Legal & Compliance',
    version: 'v2026.1',
    effectiveDate: '01 Jan 2026',
    description: 'Strict confidentiality obligations concerning examination question banks, candidate personally identifiable information (PII), and session logs.',
    mandatory: true,
  },
  {
    id: 'pol-05',
    title: 'Emergency Medical & Fire Safety Contingency Protocol',
    category: 'Health & Safety',
    version: 'v2026.1',
    effectiveDate: '01 Jun 2026',
    description: 'Procedures for handling medical emergencies, accessible PwD evacuation ramps, functional fire extinguishers on every floor, and assembly area management.',
    mandatory: false,
  },
];

export default function CentrePoliciesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header__top">
          <div>
            <h1 className="page-header__title">Centre Operational Policies & Guidelines</h1>
            <p className="page-header__subtitle">
              Official regulatory compliance policies, examination standards, and operational guidelines for OECM venues.
            </p>
          </div>
        </div>
      </div>

      {/* ── Compliance Banner ── */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          background: 'var(--color-primary-bg, #eff6ff)',
          border: '1px solid var(--color-primary-border, #bfdbfe)',
          borderRadius: 'var(--radius-md, 8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <ShieldCheck size={28} color="var(--color-primary, #2563eb)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-primary, #1e293b)' }}>
          <strong>Mandatory Compliance Notice:</strong> All examination centres registered under OECM must strictly adhere to these policies. Compliance is audited during physical technical inspections and live examination mock tests.
        </div>
      </div>

      {/* ── Policies List ── */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
          Active Policy Documents
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {POLICIES_LIST.map((policy) => (
            <div
              key={policy.id}
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-color, #e2e8f0)',
                background: 'var(--bg-surface, #ffffff)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <FileText size={18} color="var(--color-primary, #2563eb)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary, #1e293b)' }}>
                    {policy.title}
                  </span>
                  {policy.mandatory && (
                    <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                      Mandatory
                    </span>
                  )}
                  <span className="badge badge-subtle" style={{ fontSize: '0.68rem' }}>
                    {policy.category}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
                  {policy.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Version: <strong>{policy.version}</strong> • Effective Date: {policy.effectiveDate}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => alert(`Viewing ${policy.title} (${policy.version})`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ExternalLink size={13} /> View Policy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

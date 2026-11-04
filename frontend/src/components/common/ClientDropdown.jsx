import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';


export default function ClientDropdown({
  clients = [],
  selectedClientId,
  onSelect,
  loading = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const safeClients = Array.isArray(clients) ? clients : [];
  const selectedClient = safeClients.find((c) => c?.id === selectedClientId) || safeClients[0] || null;

  const handleSelect = (clientId) => {
    if (typeof onSelect === 'function' && clientId !== selectedClientId) {
      onSelect(clientId);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen((prev) => !prev)}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Filter dashboard by client"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: isOpen
            ? '1px solid var(--color-primary, #2563eb)'
            : '1px solid var(--border-default, #e2e8f0)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '5px 12px',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'var(--text-primary, #0f172a)',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(37, 99, 235, 0.12)'
            : '0 1px 3px rgba(15, 23, 42, 0.06)',
          transition: 'all 0.15s ease',
          outline: 'none',
          minHeight: 32,
        }}
      >
        <Building2
          size={14}
          style={{
            color: 'var(--color-primary, #2563eb)',
            flexShrink: 0,
          }}
        />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 400 }}>
            Client:
          </span>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--text-primary, #0f172a)',
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Loading...' : selectedClient?.name || 'Eduquity'}
          </span>
        </div>

        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--color-success, #16a34a)',
            display: 'inline-block',
          }}
          title="Active client filter"
        />

        <ChevronDown
          size={13}
          style={{
            color: 'var(--text-muted, #64748b)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            marginLeft: 2,
          }}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 9999,
            minWidth: 240,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
            padding: '6px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              padding: '6px 8px 4px 8px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted, #64748b)',
              borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
              marginBottom: 4,
            }}
          >
            Select Enterprise Client
          </div>

          {safeClients.length === 0 ? (
            <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
              Loading enterprise clients...
            </div>
          ) : (
            safeClients.map((client) => {
              if (!client) return null;
              const isSelected = client.id === selectedClientId;
              return (
                <div
                  key={client.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(client.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected
                      ? 'var(--color-primary, #2563eb)'
                      : 'var(--text-primary, #0f172a)',
                    background: isSelected
                      ? 'rgba(37, 99, 235, 0.08)'
                      : 'transparent',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-subtle, #f8fafc)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div>
                    <div>{client.name}</div>
                    {client.fullName && (
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-muted, #64748b)',
                          fontWeight: 400,
                          marginTop: 1,
                        }}
                      >
                        {client.fullName}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <Check
                      size={14}
                      style={{
                        color: 'var(--color-primary, #2563eb)',
                        strokeWidth: 2.5,
                        marginLeft: 8,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

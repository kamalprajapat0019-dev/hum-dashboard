import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * Standard Enterprise Base Modal
 * Implements the 3-part layout:
 * 1. Fixed Header (flex-shrink-0)
 * 2. Scrollable Body (flex-1 min-h-0 overflow-y-auto)
 * 3. Fixed Footer (flex-shrink-0)
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-2xl', // 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl'
  zIndex = 50,
  closeOnBackdrop = true,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop-fixed"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col w-full ${maxWidth} max-h-[90vh] overflow-hidden ${className}`.trim()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Fixed Header ── */}
        <div
          className="flex-shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{ background: '#ffffff' }}
        >
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '2px 0 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
          <IconButton
            icon={<X size={16} />}
            variant="ghost"
            size="sm"
            onClick={onClose}
            tooltip="Close"
            ariaLabel="Close modal"
          />
        </div>

        {/* ── 2. Scrollable Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* ── 3. Fixed Footer ── */}
        {footer && (
          <div
            className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default BaseModal;

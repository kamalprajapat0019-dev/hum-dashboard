import React from 'react';
import { X, Download } from 'lucide-react';

export function DocPreviewModal({
  previewUrl,
  onClose,
}) {
  if (!previewUrl) return null;

  const isImage = previewUrl.startsWith('data:image/') || previewUrl.match(/\.(jpeg|jpg|png|gif)$/i);

  return (
    <div className="modal-backdrop" style={{ zIndex: 1300 }} onClick={onClose}>
      <div
        className="modal modal-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 800, height: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">Document Preview</h3>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          {isImage ? (
            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <iframe src={previewUrl} title="Document Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
          )}
        </div>
        <div className="modal-footer">
          <a href={previewUrl} download="document" className="btn btn-sm btn-secondary" target="_blank" rel="noreferrer">
            <Download size={14} /> Open in New Tab
          </a>
          <button className="btn btn-sm btn-primary" onClick={onClose}>Close Preview</button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

const ConfirmModal = ({ message, onConfirm, onCancel, confirmLabel = 'Supprimer', confirmColor = '#dc2626' }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
  }}>
    <div style={{
      background: 'white', borderRadius: '12px', padding: '28px 24px',
      maxWidth: '400px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
    }}>
      <p style={{ fontSize: '15px', color: '#1e293b', marginBottom: '24px', lineHeight: 1.5 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{ padding: '8px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          style={{ padding: '8px 20px', background: confirmColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;

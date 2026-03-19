import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '72px', fontWeight: '800', color: '#e2e8f0', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '16px 0 8px' }}>
          Page introuvable
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>
          La page que vous cherchez n'existe pas.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 24px', background: '#2563eb', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '600'
          }}
        >
          Retour
        </button>
      </div>
    </div>
  );
};

export default NotFound;

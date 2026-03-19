import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const ToastContainer = ({ toasts }) => (
  <div style={{
    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none'
  }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding: '12px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', pointerEvents: 'auto',
        background: t.type === 'error' ? '#fef2f2' : '#f0fdf4',
        color: t.type === 'error' ? '#dc2626' : '#16a34a',
        border: `1px solid ${t.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
        animation: 'slideIn 0.2s ease',
        maxWidth: '320px'
      }}>
        {t.message}
      </div>
    ))}
    <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
  </div>
);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

import React, { useEffect, useState } from 'react';
import api from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: '6px', fontSize: '14px', marginBottom: '4px', outline: 'none', boxSizing: 'border-box'
};
const labelStyle = {
  display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151'
};

const Account = () => {
  const { user: authUser, login, token } = useAuth();
  const { addToast } = useToast();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form informations
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPwdForEmail, setCurrentPwdForEmail] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');

  // Form mot de passe
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [errorPwd, setErrorPwd] = useState('');

  useEffect(() => {
    api.get('/admin/account').then(res => {
      setAccount(res.data.data);
      setName(res.data.data.name || '');
      setEmail(res.data.data.email || '');
    }).finally(() => setLoading(false));
  }, []);

  const emailChanged = account && email !== account.email;

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo('');
    setLoadingInfo(true);
    try {
      const payload = { name, email };
      if (emailChanged) payload.current_password = currentPwdForEmail;
      const res = await api.put('/admin/account', payload);
      setAccount(res.data.data);
      setCurrentPwdForEmail('');
      login({ ...authUser, name: res.data.data.name, email: res.data.data.email }, token);
      addToast('Informations mises à jour');
    } catch (err) {
      setErrorInfo(err.response?.data?.message || 'Erreur');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setErrorPwd('');
    if (newPwd !== confirmPwd) { setErrorPwd('Les mots de passe ne correspondent pas'); return; }
    if (newPwd.length < 6) { setErrorPwd('Le mot de passe doit contenir au moins 6 caractères'); return; }
    setLoadingPwd(true);
    try {
      await api.put('/admin/account', { current_password: currentPwd, new_password: newPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      addToast('Mot de passe modifié avec succès');
    } catch (err) {
      setErrorPwd(err.response?.data?.message || 'Erreur');
    } finally {
      setLoadingPwd(false);
    }
  };

  if (loading) return <div style={{ color: '#64748b' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Mon compte</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Gérez vos informations personnelles</p>
      </div>

      {/* Informations */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Informations</h2>
        {errorInfo && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' }}>{errorInfo}</div>}
        <form onSubmit={handleInfoSubmit}>
          <label style={labelStyle}>Nom</label>
          <input style={{ ...inputStyle, marginBottom: '14px' }} value={name} onChange={e => setName(e.target.value)} required placeholder="Votre nom" />

          <label style={labelStyle}>Email</label>
          <input style={{ ...inputStyle, marginBottom: emailChanged ? '4px' : '14px' }} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.fr" />

          {emailChanged && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ ...labelStyle, color: '#b45309' }}>Mot de passe actuel (requis pour changer l'email)</label>
              <input style={{ ...inputStyle, borderColor: '#fcd34d', marginBottom: 0 }} type="password" value={currentPwdForEmail} onChange={e => setCurrentPwdForEmail(e.target.value)} placeholder="••••••••" />
            </div>
          )}

          <button type="submit" disabled={loadingInfo} style={{ padding: '9px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            {loadingInfo ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Mot de passe */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Changer le mot de passe</h2>
        {errorPwd && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' }}>{errorPwd}</div>}
        <form onSubmit={handlePwdSubmit}>
          <label style={labelStyle}>Mot de passe actuel</label>
          <input style={{ ...inputStyle, marginBottom: '14px' }} type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required placeholder="••••••••" />

          <label style={labelStyle}>Nouveau mot de passe</label>
          <input style={{ ...inputStyle, marginBottom: '4px' }} type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required placeholder="Minimum 6 caractères" />

          <label style={{ ...labelStyle, marginTop: '10px' }}>Confirmer le nouveau mot de passe</label>
          <input
            style={{ ...inputStyle, marginBottom: '14px', borderColor: confirmPwd && newPwd !== confirmPwd ? '#fca5a5' : '#e2e8f0' }}
            type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required placeholder="••••••••"
          />

          <button type="submit" disabled={loadingPwd} style={{ padding: '9px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            {loadingPwd ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Account;

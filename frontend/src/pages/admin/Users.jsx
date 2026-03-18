import React, { useEffect, useState } from 'react';
import api from '../../api.js';

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '14px',
  marginBottom: '12px',
  outline: 'none'
};

const labelStyle = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: '500',
  color: '#374151'
};

const Modal = ({ title, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email?.includes('@noemail.local') ? '' : (initialData?.email || ''),
    password: '',
    role: initialData?.role || 'visitor'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = form.role === 'admin';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '32px',
        width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }} className="modal-box">
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>{title}</h2>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Nom</label>
          <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nom complet" />

          <label style={labelStyle}>Role</label>
          <select
            style={{ ...inputStyle, marginBottom: '12px' }}
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="visitor">Visiteur</option>
            <option value="admin">Administrateur</option>
          </select>

          {isAdmin && (
            <>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="email@exemple.fr" />

              <label style={labelStyle}>{initialData ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}</label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!initialData} placeholder="••••••••" />
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              Annuler
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    await api.post('/admin/users', form);
    await load();
  };

  const handleUpdate = async (form) => {
    const payload = { name: form.name, role: form.role };
    if (form.role === 'admin') {
      payload.email = form.email;
      if (form.password) payload.password = form.password;
    }
    await api.put(`/admin/users/${editUser.id}`, payload);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await api.delete(`/admin/users/${id}`);
    await load();
  };

  const roleStyle = (role) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    background: role === 'admin' ? '#dbeafe' : '#f0fdf4',
    color: role === 'admin' ? '#1d4ed8' : '#16a34a'
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Utilisateurs</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{users.length} utilisateur(s) enregistre(s)</p>
        </div>
        <button
          onClick={() => { setEditUser(null); setShowModal(true); }}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          + Ajouter
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#64748b' }}>Chargement...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Nom</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Cree le</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{user.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                    {!user.email?.includes('@noemail.local') ? user.email : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}><span style={roleStyle(user.role)}>{user.role}</span></td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8' }}>
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => { setEditUser(user); setShowModal(true); }}
                      style={{ marginRight: '8px', padding: '5px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      style={{ padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    Aucun utilisateur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal
          title={editUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
          onClose={() => setShowModal(false)}
          onSubmit={editUser ? handleUpdate : handleCreate}
          initialData={editUser}
        />
      )}
    </div>
  );
};

export default Users;

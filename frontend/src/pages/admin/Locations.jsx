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
    address: initialData?.address || ''
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
          <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nom du lieu" />

          <label style={labelStyle}>Adresse</label>
          <input style={{ ...inputStyle, marginBottom: '24px' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Adresse complete" />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/locations');
      setLocations(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    await api.post('/admin/locations', form);
    await load();
  };

  const handleUpdate = async (form) => {
    await api.put(`/admin/locations/${editLocation.id}`, form);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette localisation ?')) return;
    await api.delete(`/admin/locations/${id}`);
    await load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Localisations</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{locations.length} localisation(s) enregistree(s)</p>
        </div>
        <button
          onClick={() => { setEditLocation(null); setShowModal(true); }}
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Adresse</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Cree le</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{loc.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{loc.address || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#94a3b8' }}>
                    {new Date(loc.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => { setEditLocation(loc); setShowModal(true); }}
                      style={{ marginRight: '8px', padding: '5px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id)}
                      style={{ padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    Aucune localisation
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal
          title={editLocation ? 'Modifier la localisation' : 'Ajouter une localisation'}
          onClose={() => setShowModal(false)}
          onSubmit={editLocation ? handleUpdate : handleCreate}
          initialData={editLocation}
        />
      )}
    </div>
  );
};

export default Locations;

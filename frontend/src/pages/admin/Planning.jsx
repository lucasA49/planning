import React, { useEffect, useState, useCallback } from 'react';
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

const toFR = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const today = () => new Date().toISOString().split('T')[0];

const PlanningModal = ({ onClose, onSubmit, initialData, locations, worksiteTypes, users }) => {
  const [form, setForm] = useState({
    start_date: initialData?.start_date || today(),
    end_date: initialData?.end_date || today(),
    location_id: initialData?.location_id || (locations[0]?.id || ''),
    worksite_type_id: initialData?.worksite_type_id || (worksiteTypes[0]?.id || ''),
    notes: initialData?.notes || '',
    user_ids: initialData?.users?.map(u => u.id) || []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleUser = (uid) => {
    setForm(f => ({
      ...f,
      user_ids: f.user_ids.includes(uid)
        ? f.user_ids.filter(id => id !== uid)
        : [...f.user_ids, uid]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        location_id: parseInt(form.location_id),
        worksite_type_id: parseInt(form.worksite_type_id)
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const visitorUsers = users.filter(u => u.role === 'visitor');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      overflowY: 'auto', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '24px 20px',
        width: '100%', maxWidth: '520px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        margin: '0 8px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
          {initialData ? 'Modifier le planning' : 'Creer un planning'}
        </h2>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Date de debut</label>
          <input
            style={inputStyle}
            type="date"
            value={form.start_date}
            onChange={e => setForm({ ...form, start_date: e.target.value })}
            required
          />

          <label style={labelStyle}>Date de fin</label>
          <input
            style={inputStyle}
            type="date"
            value={form.end_date}
            onChange={e => setForm({ ...form, end_date: e.target.value })}
            required
          />

          <label style={labelStyle}>Localisation</label>
          <select style={inputStyle} value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })} required>
            <option value="">Choisir une localisation</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <label style={labelStyle}>Type de chantier</label>
          <select style={inputStyle} value={form.worksite_type_id} onChange={e => setForm({ ...form, worksite_type_id: e.target.value })} required>
            <option value="">Choisir un type</option>
            {worksiteTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <label style={labelStyle}>Notes</label>
          <textarea
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes optionnelles..."
          />

          <label style={{ ...labelStyle, marginBottom: '8px' }}>Assigner des utilisateurs</label>
          <div style={{
            border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '180px',
            overflowY: 'auto', marginBottom: '24px'
          }}>
            {visitorUsers.length === 0 && (
              <div style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>Aucun visiteur disponible</div>
            )}
            {visitorUsers.map(u => (
              <label key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                background: form.user_ids.includes(u.id) ? '#eff6ff' : 'white'
              }}>
                <input
                  type="checkbox"
                  checked={form.user_ids.includes(u.id)}
                  onChange={() => toggleUser(u.id)}
                />
                <span style={{ fontSize: '14px', fontWeight: form.user_ids.includes(u.id) ? '600' : '400' }}>{u.name}</span>
                {u.email && !u.email.includes('@noemail.local') && (
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>{u.email}</span>
                )}
              </label>
            ))}
          </div>

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

const Planning = () => {
  const [plannings, setPlannings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [worksiteTypes, setWorksiteTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlanning, setEditPlanning] = useState(null);

  const loadPlannings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/plannings');
      setPlannings(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadMeta = async () => {
      const [loc, wt, usr] = await Promise.all([
        api.get('/admin/locations'),
        api.get('/admin/worksite-types'),
        api.get('/admin/users')
      ]);
      setLocations(loc.data.data);
      setWorksiteTypes(wt.data.data);
      setUsers(usr.data.data);
    };
    loadMeta();
  }, []);

  useEffect(() => { loadPlannings(); }, [loadPlannings]);

  const handleCreate = async (form) => {
    await api.post('/admin/plannings', form);
    await loadPlannings();
  };

  const handleUpdate = async (form) => {
    await api.put(`/admin/plannings/${editPlanning.id}`, form);
    await loadPlannings();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce planning ?')) return;
    await api.delete(`/admin/plannings/${id}`);
    await loadPlannings();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Planning</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{plannings.length} planning(s) au total</p>
        </div>
        <button
          onClick={() => { setEditPlanning(null); setShowModal(true); }}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          + Creer un planning
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#64748b' }}>Chargement...</div>
      ) : plannings.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '48px',
          textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
          <div style={{ color: '#64748b', fontSize: '15px' }}>Aucun planning</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {plannings.map(planning => {
            const wt = planning.worksiteType;
            const color = wt?.color || '#2563eb';
            return (
              <div key={planning.id} style={{
                background: 'white', borderRadius: '12px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${color}`,
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                  flexWrap: 'wrap', gap: '8px'
                }}>
                  <span style={{
                    padding: '3px 12px', borderRadius: '20px',
                    background: color + '20', color,
                    fontWeight: '700', fontSize: '12px'
                  }}>
                    {wt?.name || '—'}
                  </span>
                  <span style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {toFR(planning.start_date)} → {toFR(planning.end_date)}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>
                    {planning.location?.name || '—'}
                  </div>
                  {planning.location?.address && (
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      {planning.location.address}
                    </div>
                  )}

                  {planning.notes && (
                    <div style={{
                      fontSize: '13px', color: '#475569', marginBottom: '10px',
                      padding: '6px 10px', background: '#f8fafc', borderRadius: '6px',
                      borderLeft: '3px solid #e2e8f0'
                    }}>
                      {planning.notes}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {planning.users?.length > 0 ? planning.users.map(u => (
                      <span key={u.id} style={{
                        padding: '3px 10px', borderRadius: '20px',
                        background: '#f1f5f9', color: '#475569',
                        fontSize: '12px', fontWeight: '500'
                      }}>
                        {u.name}
                      </span>
                    )) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Aucun utilisateur assigné</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { setEditPlanning(planning); setShowModal(true); }}
                      style={{ flex: 1, padding: '7px 0', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(planning.id)}
                      style={{ flex: 1, padding: '7px 0', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <PlanningModal
          onClose={() => setShowModal(false)}
          onSubmit={editPlanning ? handleUpdate : handleCreate}
          initialData={editPlanning}
          locations={locations}
          worksiteTypes={worksiteTypes}
          users={users}
        />
      )}
    </div>
  );
};

export default Planning;

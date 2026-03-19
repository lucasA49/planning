import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api.js';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: '6px', fontSize: '14px', marginBottom: '12px', outline: 'none'
};
const labelStyle = {
  display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151'
};

const toFR = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const today = () => new Date().toISOString().split('T')[0];

/* ─── Modal création/édition ─── */
const PlanningModal = ({ onClose, onSubmit, initialData, locations, worksiteTypes, users, plannings }) => {
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

  const getConflictsForUser = (userId) => {
    if (!form.start_date || !form.end_date) return [];
    return (plannings || []).filter(p => {
      if (initialData && p.id === initialData.id) return false;
      if (!p.users?.some(u => u.id === userId)) return false;
      return p.start_date <= form.end_date && p.end_date >= form.start_date;
    });
  };

  const toggleUser = (uid) => {
    setForm(f => ({
      ...f,
      user_ids: f.user_ids.includes(uid) ? f.user_ids.filter(id => id !== uid) : [...f.user_ids, uid]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.end_date < form.start_date) {
      setError('La date de fin doit être égale ou postérieure à la date de début');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit({ ...form, location_id: parseInt(form.location_id), worksite_type_id: parseInt(form.worksite_type_id) });
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const visitorUsers = users.filter(u => u.role === 'visitor');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px 20px', width: '100%', maxWidth: '520px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', margin: '0 8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
          {initialData ? 'Modifier le planning' : 'Créer un planning'}
        </h2>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div>
              <label style={labelStyle}>Date de début</label>
              <input style={inputStyle} type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Date de fin</label>
              <input
                style={{ ...inputStyle, borderColor: form.end_date < form.start_date ? '#fca5a5' : '#e2e8f0' }}
                type="date" value={form.end_date} min={form.start_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} required
              />
            </div>
          </div>

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
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes optionnelles..." />

          <label style={{ ...labelStyle, marginBottom: '8px' }}>Assigner des travailleurs</label>
          {form.user_ids.some(uid => getConflictsForUser(uid).length > 0) && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', fontSize: '13px', color: '#92400e' }}>
              Attention : certains travailleurs ont déjà un planning sur cette période.
            </div>
          )}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto', marginBottom: '24px' }}>
            {visitorUsers.length === 0 && <div style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>Aucun visiteur disponible</div>}
            {visitorUsers.map(u => {
              const conflicts = getConflictsForUser(u.id);
              const hasConflict = form.user_ids.includes(u.id) && conflicts.length > 0;
              return (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: hasConflict ? '#fffbeb' : form.user_ids.includes(u.id) ? '#eff6ff' : 'white' }}>
                  <input type="checkbox" checked={form.user_ids.includes(u.id)} onChange={() => toggleUser(u.id)} />
                  <span style={{ fontSize: '14px', fontWeight: form.user_ids.includes(u.id) ? '600' : '400' }}>{u.name}</span>
                  {hasConflict && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '600', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                      Conflit ({conflicts.length})
                    </span>
                  )}
                  {!hasConflict && u.email && !u.email.includes('@noemail.local') && (
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>{u.email}</span>
                  )}
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Vue Calendrier ─── */
const CalendarView = ({ plannings, onEdit }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Lun

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayPlannings = plannings.filter(p => p.start_date <= dateStr && p.end_date >= dateStr);
    cells.push({ day: d, dateStr, plannings: dayPlannings });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Nav mois */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{ padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
          ‹
        </button>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', textTransform: 'capitalize', minWidth: '160px', textAlign: 'center' }}>{monthLabel}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
          ›
        </button>
        <button onClick={() => setViewDate(new Date())}
          style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#475569' }}>
          Aujourd'hui
        </button>
      </div>

      {/* Grille */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {/* Jours de la semaine */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{d}</div>
          ))}
        </div>

        {/* Cellules */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell, idx) => (
            <div key={idx} style={{
              minHeight: '80px', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
              padding: '6px', background: cell?.dateStr === todayStr ? '#eff6ff' : 'white'
            }}>
              {cell && (
                <>
                  <div style={{
                    fontSize: '12px', fontWeight: cell.dateStr === todayStr ? '700' : '400',
                    color: cell.dateStr === todayStr ? '#2563eb' : '#64748b',
                    marginBottom: '4px'
                  }}>
                    {cell.day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {cell.plannings.slice(0, 3).map(p => {
                      const color = p.worksiteType?.color || '#2563eb';
                      return (
                        <button
                          key={p.id}
                          onClick={() => onEdit(p)}
                          title={`${p.worksiteType?.name || ''} — ${p.location?.name || ''}\n${p.users?.map(u => u.name).join(', ')}`}
                          style={{
                            background: color + '22', color, border: 'none',
                            borderLeft: `2px solid ${color}`, borderRadius: '3px',
                            padding: '1px 4px', fontSize: '10px', fontWeight: '600',
                            cursor: 'pointer', textAlign: 'left', overflow: 'hidden',
                            whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%'
                          }}
                        >
                          {p.location?.name || p.worksiteType?.name || '—'}
                        </button>
                      );
                    })}
                    {cell.plannings.length > 3 && (
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>+{cell.plannings.length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Page principale ─── */
const Planning = () => {
  const { addToast } = useToast();
  const [plannings, setPlannings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [worksiteTypes, setWorksiteTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlanning, setEditPlanning] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadPlannings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/plannings');
      setPlannings(res.data.data);
    } catch (err) {
      addToast(err.friendlyMessage || 'Erreur lors du chargement', 'error');
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
    addToast('Planning créé avec succès');
  };

  const handleUpdate = async (form) => {
    await api.put(`/admin/plannings/${editPlanning.id}`, form);
    await loadPlannings();
    addToast('Planning modifié avec succès');
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/plannings/${confirmDelete.id}`);
      await loadPlannings();
      addToast('Planning supprimé');
    } catch (err) {
      addToast(err.friendlyMessage || 'Erreur lors de la suppression', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const openEdit = (planning) => { setEditPlanning(planning); setShowModal(true); };

  // Filtres
  const filtered = plannings.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      const matchLocation = p.location?.name?.toLowerCase().includes(q);
      const matchType = p.worksiteType?.name?.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      if (!matchLocation && !matchType && !matchNotes) return false;
    }
    if (filterWorker && !p.users?.some(u => u.id === parseInt(filterWorker))) return false;
    if (filterType && p.worksite_type_id !== parseInt(filterType)) return false;
    return true;
  });

  const visitorUsers = users.filter(u => u.role === 'visitor');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Planning</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{plannings.length} planning(s) au total</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Toggle liste / calendrier */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {[['list', 'Liste'], ['calendar', 'Calendrier']].map(([mode, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500',
                background: viewMode === mode ? 'white' : 'transparent',
                color: viewMode === mode ? '#1e293b' : '#64748b',
                boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}>{label}</button>
            ))}
          </div>
          <button
            onClick={() => { setEditPlanning(null); setShowModal(true); }}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            + Créer un planning
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Rechercher (chantier, type, notes)..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', flex: '1', minWidth: '200px' }}
        />
        <select value={filterWorker} onChange={e => setFilterWorker(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', color: filterWorker ? '#1e293b' : '#94a3b8' }}>
          <option value="">Tous les travailleurs</option>
          {visitorUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', color: filterType ? '#1e293b' : '#94a3b8' }}>
          <option value="">Tous les types</option>
          {worksiteTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {(search || filterWorker || filterType) && (
          <button onClick={() => { setSearch(''); setFilterWorker(''); setFilterType(''); }}
            style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            Effacer filtres
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#64748b' }}>Chargement...</div>
      ) : viewMode === 'calendar' ? (
        <CalendarView plannings={filtered} onEdit={openEdit} />
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
          <div style={{ color: '#64748b', fontSize: '15px' }}>{search || filterWorker || filterType ? 'Aucun résultat pour ces filtres' : 'Aucun planning'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(planning => {
            const wt = planning.worksiteType;
            const color = wt?.color || '#2563eb';
            const conflictingUsers = (planning.users || []).filter(u =>
              plannings.some(p =>
                p.id !== planning.id &&
                p.users?.some(pu => pu.id === u.id) &&
                p.start_date <= planning.end_date && p.end_date >= planning.start_date
              )
            );
            return (
              <div key={planning.id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}`, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '3px 12px', borderRadius: '20px', background: color + '20', color, fontWeight: '700', fontSize: '12px' }}>
                      {wt?.name || '—'}
                    </span>
                    {conflictingUsers.length > 0 && (
                      <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#fef3c7', color: '#b45309', fontWeight: '600', fontSize: '11px' }}>
                        Conflit — {conflictingUsers.map(u => u.name).join(', ')}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {toFR(planning.start_date)} → {toFR(planning.end_date)}
                  </span>
                </div>

                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>{planning.location?.name || '—'}</div>
                  {planning.location?.address && <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{planning.location.address}</div>}
                  {planning.notes && (
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #e2e8f0' }}>
                      {planning.notes}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {planning.users?.length > 0 ? planning.users.map(u => (
                      <span key={u.id} style={{ padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: '500' }}>
                        {u.name}
                      </span>
                    )) : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Aucun utilisateur assigné</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(planning)} style={{ flex: 1, padding: '7px 0', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Modifier</button>
                    <button onClick={() => setConfirmDelete(planning)} style={{ flex: 1, padding: '7px 0', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Supprimer</button>
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
          plannings={plannings}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Supprimer le planning "${confirmDelete.location?.name || ''} (${toFR(confirmDelete.start_date)} → ${toFR(confirmDelete.end_date)})" ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default Planning;

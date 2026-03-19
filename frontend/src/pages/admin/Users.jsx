import React, { useEffect, useState } from 'react';
import api from '../../api.js';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const PAGE_SIZE = 10;

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

/* ─── Modal création/édition ─── */
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
      setError(err.friendlyMessage || err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>{title}</h2>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Nom</label>
          <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nom complet" />

          <label style={labelStyle}>Role</label>
          <select style={{ ...inputStyle, marginBottom: '12px' }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="visitor">Visiteur</option>
            <option value="admin">Administrateur</option>
          </select>

          {form.role === 'admin' && (
            <>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="email@exemple.fr" />
              <label style={labelStyle}>{initialData ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}</label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!initialData} placeholder="••••••••" />
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
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

/* ─── Modal historique travailleur ─── */
const HistoryModal = ({ user, onClose }) => {
  const [plannings, setPlannings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/plannings').then(res => {
      const userPlannings = res.data.data.filter(p => p.users?.some(u => u.id === user.id));
      userPlannings.sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
      setPlannings(userPlannings);
    }).finally(() => setLoading(false));
  }, [user.id]);

  const totalDays = plannings.reduce((sum, p) => {
    if (!p.start_date || !p.end_date) return sum;
    const s = new Date(p.start_date + 'T00:00:00'), e = new Date(p.end_date + 'T00:00:00');
    return sum + Math.round((e - s) / 86400000) + 1;
  }, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '560px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>Historique — {user.name}</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>{plannings.length} planning(s) · {totalDays} jours au total</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8', padding: '4px 8px' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#64748b', fontSize: '14px' }}>Chargement...</div>
          ) : plannings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '14px' }}>Aucun planning assigné</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plannings.map(p => {
                const color = p.worksiteType?.color || '#2563eb';
                const days = p.start_date && p.end_date
                  ? Math.round((new Date(p.end_date + 'T00:00:00') - new Date(p.start_date + 'T00:00:00')) / 86400000) + 1
                  : null;
                return (
                  <div key={p.id} style={{ borderLeft: `3px solid ${color}`, padding: '10px 14px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color }}>{p.worksiteType?.name || '—'}</span>
                        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600', marginLeft: '8px' }}>{p.location?.name || '—'}</span>
                      </div>
                      {days && <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{days} j</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {toFR(p.start_date)} → {toFR(p.end_date)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Page principale ─── */
const Users = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      addToast(err.friendlyMessage || 'Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    await api.post('/admin/users', form);
    await load();
    addToast('Utilisateur créé avec succès');
  };

  const handleUpdate = async (form) => {
    const payload = { name: form.name, role: form.role };
    if (form.role === 'admin') {
      payload.email = form.email;
      if (form.password) payload.password = form.password;
    }
    await api.put(`/admin/users/${editUser.id}`, payload);
    await load();
    addToast('Utilisateur modifié avec succès');
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${confirmDelete.id}`);
      await load();
      addToast('Utilisateur supprimé');
    } catch (err) {
      addToast(err.friendlyMessage || 'Erreur lors de la suppression', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const roleStyle = (role) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: '12px',
    fontSize: '12px', fontWeight: '600',
    background: role === 'admin' ? '#dbeafe' : '#f0fdf4',
    color: role === 'admin' ? '#1d4ed8' : '#16a34a'
  });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email && !u.email.includes('@noemail.local') && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Utilisateurs</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{users.length} utilisateur(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => { setEditUser(null); setShowModal(true); }}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          + Ajouter
        </button>
      </div>

      {/* Recherche */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{
            padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
            fontSize: '14px', outline: 'none', width: '280px', background: 'white'
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: '#64748b' }}>Chargement...</div>
      ) : (
        <>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Nom</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Créé le</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => setHistoryUser(user)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1e293b', textDecoration: 'underline', textDecorationColor: '#e2e8f0' }}
                      >
                        {user.name}
                      </button>
                    </td>
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
                        onClick={() => setConfirmDelete(user)}
                        style={{ padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      {search ? 'Aucun résultat pour cette recherche' : 'Aucun utilisateur'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: currentPage === 1 ? 'default' : 'pointer', background: 'white', color: currentPage === 1 ? '#cbd5e1' : '#1e293b', fontSize: '13px' }}>
                Précédent
              </button>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Page {currentPage} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: currentPage === totalPages ? 'default' : 'pointer', background: 'white', color: currentPage === totalPages ? '#cbd5e1' : '#1e293b', fontSize: '13px' }}>
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal
          title={editUser ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
          onClose={() => setShowModal(false)}
          onSubmit={editUser ? handleUpdate : handleCreate}
          initialData={editUser}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Supprimer l'utilisateur "${confirmDelete.name}" ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {historyUser && (
        <HistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />
      )}
    </div>
  );
};

export default Users;

import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api.js';
import WeekPicker, { getMondayOfWeek, toISODate } from '../../components/WeekPicker.jsx';

const toFR = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const MySchedule = () => {
  const [week, setWeek] = useState(toISODate(getMondayOfWeek(new Date())));
  const [plannings, setPlannings] = useState([]);
  const [allPlannings, setAllPlannings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week');

  const loadPlannings = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === 'week') {
        const d = new Date(week + 'T00:00:00');
        d.setDate(d.getDate() + 6);
        const endOfWeek = d.toISOString().split('T')[0];
        const res = await api.get(`/visitor/plannings?start=${week}&end=${endOfWeek}`);
        setPlannings(res.data.data);
      } else {
        const res = await api.get('/visitor/plannings');
        setAllPlannings(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [week, viewMode]);

  useEffect(() => { loadPlannings(); }, [loadPlannings]);

  const groupByMonth = (list) => {
    const grouped = {};
    for (const p of list) {
      const key = p.start_date ? p.start_date.slice(0, 7) : 'unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    }
    return grouped;
  };

  return (
    <div style={{ maxWidth: '700px', width: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
          Planning
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Consultez les plannings de chantier</p>
      </div>

      {/* Toggle + WeekPicker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', alignSelf: 'flex-start' }}>
          <button
            onClick={() => setViewMode('week')}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              background: viewMode === 'week' ? '#2563eb' : 'white',
              color: viewMode === 'week' ? 'white' : '#64748b'
            }}
          >
            Semaine
          </button>
          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              background: viewMode === 'all' ? '#2563eb' : 'white',
              color: viewMode === 'all' ? 'white' : '#64748b'
            }}
          >
            Tout voir
          </button>
        </div>

        {viewMode === 'week' && (
          <WeekPicker value={week} onChange={setWeek} />
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: '#64748b', padding: '20px 0' }}>Chargement...</div>
      ) : viewMode === 'week' ? (
        plannings.length === 0 ? (
          <EmptyState message="Aucun chantier planifié cette semaine" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plannings.map(p => <PlanningCard key={p.id} planning={p} />)}
          </div>
        )
      ) : (
        allPlannings.length === 0 ? (
          <EmptyState message="Aucun chantier planifié" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.entries(groupByMonth(allPlannings))
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([monthKey, items]) => (
                <div key={monthKey}>
                  <div style={{
                    fontSize: '12px', fontWeight: '700', color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px'
                  }}>
                    {monthKey !== 'unknown'
                      ? new Date(monthKey + '-01T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                      : 'Non daté'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map(p => <PlanningCard key={p.id} planning={p} />)}
                  </div>
                </div>
              ))}
          </div>
        )
      )}
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div style={{
    background: 'white', borderRadius: '12px', padding: '40px 20px',
    textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)'
  }}>
    <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
    <div style={{ color: '#64748b', fontSize: '14px' }}>{message}</div>
  </div>
);

const DAY_TYPE_LABELS = { morning: 'Matin', afternoon: 'Après-midi' };

const PlanningCard = ({ planning }) => {
  const wt = planning.worksiteType;
  const color = wt?.color || '#2563eb';
  const halfDayLabel = DAY_TYPE_LABELS[planning.day_type];

  return (
    <div style={{
      background: 'white', borderRadius: '12px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 12px', borderRadius: '20px',
            background: color + '20', color,
            fontWeight: '700', fontSize: '12px'
          }}>
            {wt?.name || '—'}
          </span>
          {halfDayLabel && (
            <span style={{
              padding: '2px 8px', borderRadius: '10px',
              background: '#fef3c7', color: '#b45309',
              fontWeight: '600', fontSize: '11px'
            }}>
              {halfDayLabel}
            </span>
          )}
        </div>
        <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
          {toFR(planning.start_date)} → {toFR(planning.end_date)}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>
          {planning.location?.name || '—'}
        </div>
        {planning.location?.address && (
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
            {planning.location.address}
          </div>
        )}

        {planning.notes && (
          <div style={{
            fontSize: '13px', color: '#475569', marginBottom: '12px',
            padding: '8px 10px', background: '#f8fafc', borderRadius: '6px',
            borderLeft: '3px solid #e2e8f0'
          }}>
            {planning.notes}
          </div>
        )}

        {planning.users?.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Équipe ({planning.users.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {planning.users.map(u => (
                <span key={u.id} style={{
                  padding: '4px 10px', borderRadius: '20px',
                  background: '#f1f5f9', color: '#475569',
                  fontSize: '12px', fontWeight: '500'
                }}>
                  {u.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySchedule;

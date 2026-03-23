import React, { useEffect, useState } from 'react';
import api from '../../api.js';

const getWeekBounds = (weekValue) => {
  // weekValue format: "2026-W12"
  const [year, weekPart] = weekValue.split('-W');
  const week = parseInt(weekPart, 10);
  // ISO week: find Thursday of that week, then go back to Monday
  const jan4 = new Date(parseInt(year), 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (dayOfWeek - 1) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
};

const getMonthBounds = (monthValue) => {
  // monthValue format: "2026-03"
  const [year, month] = monthValue.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

const getCurrentWeekValue = () => {
  const now = new Date();
  // ISO week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const Stats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [weekValue, setWeekValue] = useState(getCurrentWeekValue());
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let params = {};
        if (filterMode === 'week') {
          const { start, end } = getWeekBounds(weekValue);
          params = { start, end };
        } else if (filterMode === 'month') {
          const { start, end } = getMonthBounds(monthValue);
          params = { start, end };
        }
        const res = await api.get('/admin/stats', { params });
        setStats(res.data.data);
      } catch (err) {
        setError('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterMode, weekValue, monthValue]);

  const [sortKey, setSortKey] = useState('total_days');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortedStats = [...stats].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const maxDays = sortedStats.length > 0 ? Math.max(...sortedStats.map(s => s.total_days)) : 1;

  const formatDays = (d) => Number.isInteger(d) ? `${d} j` : `${d} j`;

  const exportCSV = () => {
    let periodLabel = 'total';
    if (filterMode === 'week') periodLabel = weekValue;
    else if (filterMode === 'month') periodLabel = monthValue;

    const header = 'Nom du travailleur,Nombre de plannings,Jours travailles\n';
    const rows = stats.map(s => `"${s.name}",${s.plannings_count},${s.total_days}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stats_${periodLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterBtnStyle = (active) => ({
    padding: '6px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    background: active ? '#2563eb' : '#f1f5f9',
    color: active ? 'white' : '#64748b',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Statistiques</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Jours travailles par travailleur</p>
        </div>
        {stats.length > 0 && (
          <button
            onClick={exportCSV}
            style={{
              padding: '8px 18px', background: '#f0fdf4', color: '#16a34a',
              border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600'
            }}
          >
            Exporter CSV
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={{
        background: 'white', borderRadius: '12px', padding: '16px 20px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Filtrer par :</span>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button style={filterBtnStyle(filterMode === 'all')} onClick={() => setFilterMode('all')}>Tout</button>
          <button style={filterBtnStyle(filterMode === 'week')} onClick={() => setFilterMode('week')}>Semaine</button>
          <button style={filterBtnStyle(filterMode === 'month')} onClick={() => setFilterMode('month')}>Mois</button>
        </div>

        {filterMode === 'week' && (
          <input
            type="week"
            value={weekValue}
            onChange={(e) => setWeekValue(e.target.value)}
            style={{
              border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '5px 10px', fontSize: '13px', color: '#1e293b',
              outline: 'none', cursor: 'pointer'
            }}
          />
        )}

        {filterMode === 'month' && (
          <input
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
            style={{
              border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '5px 10px', fontSize: '13px', color: '#1e293b',
              outline: 'none', cursor: 'pointer'
            }}
          />
        )}

        {filterMode !== 'all' && (
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {filterMode === 'week' ? (() => { const { start, end } = getWeekBounds(weekValue); return `${start} → ${end}`; })()
              : (() => { const { start, end } = getMonthBounds(monthValue); return `${start} → ${end}`; })()}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#64748b' }}>Chargement...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '8px', fontSize: '14px' }}>
          {error}
        </div>
      ) : stats.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '48px',
          textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <div style={{ color: '#64748b', fontSize: '15px' }}>Aucune statistique disponible pour cette période</div>
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {[
                  { key: 'name', label: 'Nom du travailleur', align: 'left' },
                  { key: 'plannings_count', label: 'Plannings', align: 'center', width: '140px' },
                  { key: 'total_days', label: `Jours travaillés ${filterMode === 'week' ? '(semaine)' : filterMode === 'month' ? '(mois)' : '(total)'}`, align: 'left' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '12px 16px', textAlign: col.align, fontSize: '13px',
                      fontWeight: '600', color: sortKey === col.key ? '#2563eb' : '#64748b',
                      cursor: 'pointer', userSelect: 'none', width: col.width,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((s, i) => {
                const barWidth = maxDays > 0 ? Math.round((s.total_days / maxDays) * 100) : 0;
                return (
                  <tr key={s.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: '#dbeafe', color: '#1d4ed8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '700', flexShrink: 0
                        }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 12px', borderRadius: '12px',
                        background: '#f0fdf4', color: '#16a34a',
                        fontSize: '13px', fontWeight: '600'
                      }}>
                        {s.plannings_count}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          flex: 1, height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${barWidth}%`, height: '100%',
                            background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
                            borderRadius: '5px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', minWidth: '48px', textAlign: 'right' }}>
                          {formatDays(s.total_days)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Stats;

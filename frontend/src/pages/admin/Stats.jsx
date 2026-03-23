import React, { useEffect, useRef, useState } from 'react';
import api from '../../api.js';

/* ─── Helpers dates ─── */
const getWeekBounds = (weekValue) => {
  const [year, weekPart] = weekValue.split('-W');
  const week = parseInt(weekPart, 10);
  const jan4 = new Date(parseInt(year), 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (dayOfWeek - 1) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
};

const getMonthBounds = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
};

const getCurrentWeekValue = () => {
  const now = new Date();
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

/* ─── Couleurs travailleurs ─── */
const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d', '#ea580c', '#0d9488'];

/* ─── Label de période ─── */
const formatPeriodLabel = (period, groupBy) => {
  if (groupBy === 'week') {
    const [, w] = period.split('-W');
    return `S${w}`;
  }
  const [year, month] = period.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

/* ─── Graphique SVG ─── */
const AttendanceChart = ({ periods, selectedIds, allWorkers, groupBy }) => {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const colorMap = {};
  allWorkers.forEach((w, i) => { colorMap[w.id] = COLORS[i % COLORS.length]; });

  if (!periods || periods.length === 0 || selectedIds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '14px' }}>
        Aucune donnée — créez des plannings pour voir l'activité
      </div>
    );
  }

  const maxDays = Math.max(
    ...periods.flatMap(p => p.workers.filter(w => selectedIds.includes(w.user_id)).map(w => w.days)),
    1
  );

  const BAR_W = 18;
  const BAR_GAP = 3;
  const GRP_PAD = 14;
  const PAD_L = 42;
  const PAD_B = 48;
  const PAD_T = 18;
  const PAD_R = 12;
  const CH = 200;

  const grpW = selectedIds.length * (BAR_W + BAR_GAP) - BAR_GAP + GRP_PAD;
  const svgW = PAD_L + periods.length * grpW + PAD_R;
  const svgH = CH + PAD_T + PAD_B;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const handleMouseMove = (e, data) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ ...data, cx: e.clientX - rect.left, cy: e.clientY - rect.top });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '8px' }}>
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          style={{ display: 'block', minWidth: '300px' }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Lignes de grille + labels Y */}
          {yTicks.map(f => {
            const y = PAD_T + CH - f * CH;
            const val = Math.round(f * maxDays * 2) / 2;
            return (
              <g key={f}>
                <line x1={PAD_L} y1={y} x2={svgW - PAD_R} y2={y}
                  stroke={f === 0 ? '#e2e8f0' : '#f1f5f9'} strokeWidth={f === 0 ? 1.5 : 1} />
                <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{val}</text>
              </g>
            );
          })}

          {/* Barres par période */}
          {periods.map((period, pi) => {
            const gx = PAD_L + pi * grpW + GRP_PAD / 2;
            const labelX = gx + (selectedIds.length * (BAR_W + BAR_GAP) - BAR_GAP) / 2;
            const workingDays = period.working_days;

            return (
              <g key={period.period}>
                {selectedIds.map((wid, wi) => {
                  const worker = period.workers.find(w => w.user_id === wid);
                  const days = worker?.days || 0;
                  const bh = days > 0 ? Math.max((days / maxDays) * CH, 3) : 0;
                  const bx = gx + wi * (BAR_W + BAR_GAP);
                  const by = PAD_T + CH - bh;
                  const color = colorMap[wid] || '#2563eb';
                  const absRate = workingDays > 0 ? Math.round((1 - days / workingDays) * 100) : null;

                  return (
                    <g key={wid}>
                      {/* Fond disponible */}
                      <rect x={bx} y={PAD_T} width={BAR_W} height={CH}
                        fill="#f8fafc" rx="3" />
                      {/* Barre travaillée */}
                      {bh > 0 && (
                        <rect
                          x={bx} y={by} width={BAR_W} height={bh}
                          fill={color} rx="3"
                          style={{ cursor: 'pointer', opacity: 0.88 }}
                          onMouseEnter={e => handleMouseMove(e, {
                            name: allWorkers.find(w => w.id === wid)?.name || '',
                            days, workingDays, absRate, color
                          })}
                          onMouseMove={e => handleMouseMove(e, {
                            name: allWorkers.find(w => w.id === wid)?.name || '',
                            days, workingDays, absRate, color
                          })}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      )}
                      {/* Label jours sur la barre si assez haute */}
                      {bh >= 20 && (
                        <text x={bx + BAR_W / 2} y={by + bh - 5}
                          textAnchor="middle" fontSize="9" fill="white" fontWeight="700">
                          {days % 1 === 0 ? days : days.toFixed(1)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Label X */}
                <text x={labelX} y={PAD_T + CH + 16} textAnchor="middle" fontSize="10" fill="#64748b">
                  {formatPeriodLabel(period.period, groupBy)}
                </text>
                {groupBy === 'week' && (
                  <text x={labelX} y={PAD_T + CH + 28} textAnchor="middle" fontSize="9" fill="#94a3b8">
                    {period.period.split('-')[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip flottant (hors SVG, plus facile) */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.cx + 14, top: tooltip.cy - 10,
          background: '#1e293b', color: 'white', borderRadius: '8px',
          padding: '8px 12px', fontSize: '12px', pointerEvents: 'none',
          zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', minWidth: '150px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: '700' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: tooltip.color, flexShrink: 0 }} />
            {tooltip.name}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px' }}>
            <div>{tooltip.days % 1 === 0 ? tooltip.days : tooltip.days.toFixed(1)} j travaillés / {tooltip.workingDays} j ouvrés</div>
            {tooltip.absRate !== null && (
              <div style={{
                marginTop: '3px', fontWeight: '700',
                color: tooltip.absRate <= 20 ? '#4ade80' : tooltip.absRate <= 50 ? '#fbbf24' : '#f87171'
              }}>
                Absence : {tooltip.absRate}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Sélecteur multi-travailleurs ─── */
const WorkerSelector = ({ allWorkers, selectedIds, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };

  const label = selectedIds.length === 0 ? 'Aucun sélectionné'
    : selectedIds.length === allWorkers.length ? 'Tous les travailleurs'
    : `${selectedIds.length} sélectionné(s)`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
          background: 'white', cursor: 'pointer', fontSize: '13px', color: '#1e293b',
          display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
        }}
      >
        {label}
        <span style={{ color: '#94a3b8', fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 200, marginTop: '4px',
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: '200px', overflow: 'hidden'
        }}>
          {/* Tout / Aucun */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
            <button onClick={() => onChange(allWorkers.map(w => w.id))}
              style={{ flex: 1, padding: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>
              Tout
            </button>
            <button onClick={() => onChange([])}
              style={{ flex: 1, padding: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
              Aucun
            </button>
          </div>
          {allWorkers.map((w, i) => (
            <label key={w.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 14px', cursor: 'pointer',
              background: selectedIds.includes(w.id) ? '#eff6ff' : 'white',
              borderBottom: i < allWorkers.length - 1 ? '1px solid #f8fafc' : 'none'
            }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0,
                background: COLORS[i % COLORS.length]
              }} />
              <span style={{ fontSize: '13px', flex: 1, color: '#1e293b' }}>{w.name}</span>
              <input type="checkbox" checked={selectedIds.includes(w.id)} onChange={() => toggle(w.id)}
                style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Page Stats ─── */
const Stats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [weekValue, setWeekValue] = useState(getCurrentWeekValue());
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue());

  // Graphique d'activité
  const [allWorkers, setAllWorkers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [chartGroupBy, setChartGroupBy] = useState('month');
  const [attendancePeriods, setAttendancePeriods] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Charger travailleurs
  useEffect(() => {
    api.get('/admin/users').then(res => {
      const visitors = res.data.data.filter(u => u.role === 'visitor');
      setAllWorkers(visitors);
      setSelectedIds(visitors.map(u => u.id));
    });
  }, []);

  // Charger données graphique
  useEffect(() => {
    if (selectedIds.length === 0) { setAttendancePeriods([]); return; }
    setChartLoading(true);
    api.get('/admin/stats/attendance', { params: { users: selectedIds.join(','), groupBy: chartGroupBy } })
      .then(res => setAttendancePeriods(res.data.data))
      .catch(() => setAttendancePeriods([]))
      .finally(() => setChartLoading(false));
  }, [selectedIds, chartGroupBy]);

  // Charger stats tableau
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let params = {};
        if (filterMode === 'week') { const { start, end } = getWeekBounds(weekValue); params = { start, end }; }
        else if (filterMode === 'month') { const { start, end } = getMonthBounds(monthValue); params = { start, end }; }
        const res = await api.get('/admin/stats', { params });
        setStats(res.data.data);
      } catch { setError('Impossible de charger les statistiques'); }
      finally { setLoading(false); }
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
  const formatDays = (d) => `${d} j`;

  const exportCSV = () => {
    let periodLabel = 'total';
    if (filterMode === 'week') periodLabel = weekValue;
    else if (filterMode === 'month') periodLabel = monthValue;
    const header = 'Nom du travailleur,Nombre de plannings,Jours travailles\n';
    const rows = stats.map(s => `"${s.name}",${s.plannings_count},${s.total_days}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `stats_${periodLabel}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const btnStyle = (active) => ({
    padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: '600',
    background: active ? '#2563eb' : '#f1f5f9',
    color: active ? 'white' : '#64748b',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Statistiques</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Jours travaillés par travailleur</p>
        </div>
        {stats.length > 0 && (
          <button onClick={exportCSV} style={{ padding: '8px 18px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
            Exporter CSV
          </button>
        )}
      </div>

      {/* Filtres tableau */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Filtrer par :</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button style={btnStyle(filterMode === 'all')} onClick={() => setFilterMode('all')}>Tout</button>
          <button style={btnStyle(filterMode === 'week')} onClick={() => setFilterMode('week')}>Semaine</button>
          <button style={btnStyle(filterMode === 'month')} onClick={() => setFilterMode('month')}>Mois</button>
        </div>
        {filterMode === 'week' && (
          <input type="week" value={weekValue} onChange={e => setWeekValue(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '13px', color: '#1e293b', outline: 'none' }} />
        )}
        {filterMode === 'month' && (
          <input type="month" value={monthValue} onChange={e => setMonthValue(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '13px', color: '#1e293b', outline: 'none' }} />
        )}
        {filterMode !== 'all' && (
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {filterMode === 'week' ? (() => { const { start, end } = getWeekBounds(weekValue); return `${start} → ${end}`; })()
              : (() => { const { start, end } = getMonthBounds(monthValue); return `${start} → ${end}`; })()}
          </span>
        )}
      </div>

      {/* Tableau */}
      {loading ? (
        <div style={{ color: '#64748b' }}>Chargement...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '8px', fontSize: '14px' }}>{error}</div>
      ) : stats.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <div style={{ color: '#64748b', fontSize: '15px' }}>Aucune statistique disponible pour cette période</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {[
                  { key: 'name', label: 'Nom du travailleur', align: 'left' },
                  { key: 'plannings_count', label: 'Plannings', align: 'center', width: '140px' },
                  { key: 'total_days', label: `Jours travaillés ${filterMode === 'week' ? '(semaine)' : filterMode === 'month' ? '(mois)' : '(total)'}`, align: 'left' },
                ].map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: '12px 16px', textAlign: col.align, fontSize: '13px', fontWeight: '600', color: sortKey === col.key ? '#2563eb' : '#64748b', cursor: 'pointer', userSelect: 'none', width: col.width, whiteSpace: 'nowrap' }}>
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
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '2px 12px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>
                        {s.plannings_count}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${barWidth}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: '5px', transition: 'width 0.3s ease' }} />
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

      {/* ─── Section Graphique d'activité ─── */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Graphique d'activité</h2>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Jours travaillés par période — survolez une barre pour voir le taux d'absentéisme</p>
        </div>

        {/* Contrôles */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <WorkerSelector allWorkers={allWorkers} selectedIds={selectedIds} onChange={setSelectedIds} />

          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px', marginLeft: 'auto' }}>
            {[['month', 'Mois'], ['week', 'Semaine']].map(([val, label]) => (
              <button key={val} onClick={() => setChartGroupBy(val)} style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500',
                background: chartGroupBy === val ? 'white' : 'transparent',
                color: chartGroupBy === val ? '#1e293b' : '#64748b',
                boxShadow: chartGroupBy === val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '20px' }}>
          {chartLoading ? (
            <div style={{ color: '#64748b', padding: '40px', textAlign: 'center', fontSize: '14px' }}>Chargement...</div>
          ) : (
            <AttendanceChart
              periods={attendancePeriods}
              selectedIds={selectedIds}
              allWorkers={allWorkers}
              groupBy={chartGroupBy}
            />
          )}

          {/* Légende */}
          {selectedIds.length > 0 && allWorkers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              {allWorkers.filter(w => selectedIds.includes(w.id)).map((w, i) => {
                const idx = allWorkers.findIndex(u => u.id === w.id);
                return (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                    {w.name}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info taux */}
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>Taux d'absence calculé sur les jours ouvrés (lun–ven) de la période</span>
            <span style={{ display: 'flex', gap: '8px' }}>
              <span>🟢 &lt;20%</span>
              <span>🟡 20–50%</span>
              <span>🔴 &gt;50%</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;

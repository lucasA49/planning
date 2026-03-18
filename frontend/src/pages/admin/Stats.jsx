import React, { useEffect, useState } from 'react';
import api from '../../api.js';

const Stats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } catch (err) {
        setError('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxDays = stats.length > 0 ? Math.max(...stats.map(s => s.total_days)) : 1;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Statistiques</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Jours travailles par travailleur</p>
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
          <div style={{ color: '#64748b', fontSize: '15px' }}>Aucune statistique disponible</div>
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                  Nom du travailleur
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#64748b', width: '160px' }}>
                  Nombre de plannings
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                  Jours travailles total
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => {
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
                          {s.total_days} j
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

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api.js';

const StatCard = ({ title, value, color, to }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s'
    }}>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>{title}</div>
      <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b' }}>{value}</div>
    </div>
  </Link>
);

const getMondayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, locations: 0, worksiteTypes: 0, planningsThisWeek: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, locations, types, plannings] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/locations'),
          api.get('/admin/worksite-types'),
          api.get(`/admin/plannings?week=${getMondayOfCurrentWeek()}`)
        ]);
        setStats({
          users: users.data.data.length,
          locations: locations.data.data.length,
          worksiteTypes: types.data.data.length,
          planningsThisWeek: plannings.data.data.length
        });
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
          Tableau de bord
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Vue d'ensemble de l'application</p>
      </div>

      {loading ? (
        <div style={{ color: '#64748b' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <StatCard title="Utilisateurs" value={stats.users} color="#2563eb" to="/admin/users" />
          <StatCard title="Localisations" value={stats.locations} color="#10b981" to="/admin/locations" />
          <StatCard title="Types de chantier" value={stats.worksiteTypes} color="#f59e0b" to="/admin/worksite-types" />
          <StatCard title="Plannings cette semaine" value={stats.planningsThisWeek} color="#8b5cf6" to="/admin/planning" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {[
          { title: 'Gerer les utilisateurs', desc: 'Ajouter, modifier ou supprimer des utilisateurs', to: '/admin/users', color: '#2563eb' },
          { title: 'Gerer les localisations', desc: 'Configurer les lieux de chantier', to: '/admin/locations', color: '#10b981' },
          { title: 'Types de chantier', desc: 'Definir les types de missions', to: '/admin/worksite-types', color: '#f59e0b' },
          { title: 'Gerer le planning', desc: 'Planifier et assigner des missions', to: '/admin/planning', color: '#8b5cf6' }
        ].map((item) => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: item.color, marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ fontSize: '14px', color: '#64748b' }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

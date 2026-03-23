import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkBase = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 20px', color: '#94a3b8', textDecoration: 'none',
    fontSize: '14px', transition: 'all 0.15s'
  };
  const linkActive = { ...linkBase, color: 'white', background: '#2563eb', borderLeft: '3px solid #60a5fa' };
  const getLinkStyle = ({ isActive }) => isActive ? linkActive : linkBase;

  const adminLinks = (
    <>
      <NavLink to="/admin" end style={getLinkStyle}>Dashboard</NavLink>
      <NavLink to="/admin/users" style={getLinkStyle}>Utilisateurs</NavLink>
      <NavLink to="/admin/locations" style={getLinkStyle}>Localisations</NavLink>
      <NavLink to="/admin/worksite-types" style={getLinkStyle}>Types de chantier</NavLink>
      <NavLink to="/admin/planning" style={getLinkStyle}>Planning</NavLink>
      <NavLink to="/admin/stats" style={getLinkStyle}>Statistiques</NavLink>
    </>
  );

  const visitorLinks = (
    <>
      <NavLink to="/visitor" end style={getLinkStyle}>Planning</NavLink>
      {!user && (
        <NavLink to="/login" style={getLinkStyle}>Connexion admin</NavLink>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Top bar mobile */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: '#1e293b', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px', height: '56px'
        }}>
          <span style={{ color: '#93c5fd', fontWeight: '700', fontSize: '16px' }}>Planning App</span>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'white', fontSize: '22px', padding: '8px', lineHeight: 1
            }}
            aria-label="Menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>

        {/* Drawer */}
        {open && (
          <div style={{
            position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0,
            background: '#1e293b', zIndex: 199, display: 'flex', flexDirection: 'column',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '8px' }}>
              {user?.role === 'admin' ? adminLinks : visitorLinks}
            </div>
            <div style={{ marginTop: 'auto' }}>
              {user && (
                <NavLink to="/admin/account" style={({ isActive }) => ({
                  display: 'block', padding: '16px 20px', borderTop: '1px solid #334155',
                  fontSize: '12px', textDecoration: 'none',
                  background: isActive ? '#2563eb22' : 'transparent',
                })}>
                  <div style={{ fontWeight: '600', color: '#cbd5e1', marginBottom: '2px' }}>{user.name}</div>
                  <div style={{ color: '#64748b' }}>{user.email}</div>
                </NavLink>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '16px 20px', borderTop: '1px solid #334155',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                    fontSize: '14px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                >
                  Deconnexion
                </button>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <nav style={{
      display: 'flex', flexDirection: 'column', width: '220px', minHeight: '100vh',
      background: '#1e293b', color: 'white', flexShrink: 0
    }}>
      <div style={{ padding: '24px 20px', fontSize: '18px', fontWeight: '700', borderBottom: '1px solid #334155', color: '#93c5fd' }}>
        Planning App
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '8px' }}>
        {user?.role === 'admin' ? adminLinks : visitorLinks}
      </div>

      <div style={{ marginTop: 'auto' }}>
        {user && (
          <NavLink to="/admin/account" style={({ isActive }) => ({
            display: 'block', padding: '16px 20px', borderTop: '1px solid #334155',
            fontSize: '12px', textDecoration: 'none',
            background: isActive ? '#2563eb22' : 'transparent',
          })}>
            <div style={{ fontWeight: '600', color: '#cbd5e1', marginBottom: '2px' }}>{user.name}</div>
            <div style={{ color: '#64748b' }}>{user.email}</div>
            <div style={{ marginTop: '4px', textTransform: 'uppercase', fontSize: '11px', color: '#2563eb' }}>{user.role}</div>
          </NavLink>
        )}
        {user && (
          <button
            onClick={handleLogout}
            style={{
              marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #334155',
              cursor: 'pointer', color: '#94a3b8', fontSize: '14px', background: 'none',
              border: 'none', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            Deconnexion
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

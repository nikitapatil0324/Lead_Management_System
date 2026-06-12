import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚡ LeadFlow</span>
        </Link>
        
        <div className="nav-links">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            <LayoutDashboard size={18} />
            <span className="nav-link-text">Dashboard</span>
          </Link>
          
          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }}></div>
          
          <div className="user-tag">
            <User size={16} />
            <span className="nav-user-name" style={{ fontWeight: '600' }}>{user.name}</span>
            <span className={`badge badge-${user.role.toLowerCase()} nav-user-role`}>
              {user.role}
            </span>
          </div>

          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LogOut size={15} />
            <span className="nav-logout-text">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

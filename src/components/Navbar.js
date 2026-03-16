import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import hpLogo from '../assets/HP-Logoforanimation.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard',  label: 'Dashboard',      icon: '⬡' },
    { to: '/import',     label: 'Import Coupons',  icon: '↑' },
    { to: '/winners',    label: 'Winners',         icon: '🏆' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <Link to="/dashboard" className="navbar-brand">
          <img src={hpLogo} alt="HP" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
          <div className="brand-text">
            <span className="brand-title">HPCL</span>
            <span className="brand-sub">Lucky Draw</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          <div className="pump-info">
            <div className="pump-dot" />
            <span className="pump-name">{user?.pumpName}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>

      </div>
    </nav>
  );
}

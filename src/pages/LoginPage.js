import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import hpLogo from '../assets/HP-Logoforanimation.png';
import './LoginPage.css';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-image" />
      <div className="login-bg-overlay" />

      <div className="login-container animate-in">

        {/* HP Logo — centred at top, no other brand image */}
        <div className="login-brand">
          <img src={hpLogo} alt="HP" className="hp-main-logo" />
        </div>

        <div className="login-divider-top" />

        <div className="login-header">
          <h1 className="login-title">Hindustan Petroleum</h1>
          <p className="login-subtitle">Campaign Lucky Draw Portal</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="pump@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn login-btn" disabled={loading}>
            {loading ? (
              <><div className="btn-spinner" /> Signing In...</>
            ) : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <div className="login-badge">
            <span className="login-dot" />
            Secure Portal — HPCL Lucky Draw 2026
          </div>
        </div>
      </div>
    </div>
  );
}

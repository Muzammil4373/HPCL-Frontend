import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './DashboardPage.css';

const TOTAL_EVENTS = 26;

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events,      setEvents]      = useState([]);
  const [couponCount, setCouponCount] = useState(0);
  const [loading,     setLoading]     = useState(true);

  // Restart modal state
  const [showRestartModal,  setShowRestartModal]  = useState(false);
  const [restarting,        setRestarting]        = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get('/api/events');
      setEvents(data.events);
      setCouponCount(data.couponCount);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Restart handler ──────────────────────────────────────────────────────
  const handleRestart = async () => {
    setRestarting(true);
    try {
      const { data } = await api.post('/api/events/restart');
      toast.success(data.message || 'Events restarted successfully!');
      setShowRestartModal(false);
      // Refresh dashboard so Event 1 shows Open and rest are locked
      await fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restart failed. Please try again.');
    } finally {
      setRestarting(false);
    }
  };

  const wonCount  = events.filter(e => e.winner).length;
  const openCount = events.filter(e => e.isUnlocked && !e.winner).length;

  if (loading) return (
    <div className="page">
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div className="page">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="dashboard-hero animate-in">
        <div className="hero-content">
          <p className="hero-eyebrow">HPCL PROMOTIONAL CAMPAIGN</p>
          <h1 className="hero-title">Lucky Draw Events</h1>
          <p className="hero-pump">{user?.pumpName}</p>
        </div>
        <div className="hero-stats">
          <div className="stat-chip">
            <span className="stat-num">{couponCount.toLocaleString()}</span>
            <span className="stat-label">Coupons</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num" style={{ color: '#00c851' }}>{openCount}</span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num" style={{ color: '#f5a623' }}>{wonCount}</span>
            <span className="stat-label">Winners</span>
          </div>
        </div>
      </div>

      {/* ── No coupons warning ────────────────────────────────────────────── */}
      {couponCount === 0 && (
        <div className="no-coupons-banner animate-in">
          <span>⚠</span>
          <p>
            No coupons imported yet.{' '}
            <button className="link-btn" onClick={() => navigate('/import')}>
              Import your coupon data
            </button>{' '}
            to get started.
          </p>
        </div>
      )}

      {/* ── Restart Event button ──────────────────────────────────────────── */}
      <div className="restart-bar animate-in">
        <div className="restart-bar-left">
          <span className="restart-bar-icon">🔄</span>
          <div>
            <p className="restart-bar-title">Restart Events</p>
            <p className="restart-bar-desc">
              Reset to Event 1 and clear all winner records for this pump.
            </p>
          </div>
        </div>
        <button
          className="btn btn-restart"
          onClick={() => setShowRestartModal(true)}
        >
          ↺ Restart Event
        </button>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div className="progress-section animate-in">
        <div className="progress-header">
          <span className="section-title">Campaign Progress</span>
          <span className="progress-text">{wonCount} / {TOTAL_EVENTS} Events Completed</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(wonCount / TOTAL_EVENTS) * 100}%` }} />
        </div>
      </div>

      {/* ── Events Grid ───────────────────────────────────────────────────── */}
      <div className="section-title" style={{ marginTop: 32 }}>Draw Overview</div>
      <div className="events-grid">
        {events.map((event, i) => {
          const hasWinner = !!event.winner;
          const isLocked  = !event.isUnlocked;

          return (
            <div
              key={event.eventNumber}
              className={`event-card ${isLocked ? 'locked' : hasWinner ? 'won' : 'open'}`}
              onClick={() => !isLocked && navigate(`/event/${event.eventNumber}`)}
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <div className="event-number">
                <span className="event-num-label">Draw</span>
                <span className="event-num-value">
                  {String(event.eventNumber).padStart(2, '0')}
                </span>
              </div>

              <div className="event-status">
                {isLocked ? (
                  <>
                    <span className="lock-icon">🔒</span>
                    <span className="badge badge-locked">LOCKED</span>
                  </>
                ) : hasWinner ? (
                  <>
                    <span className="winner-code">{event.winner.couponCode}</span>
                    <span className="badge badge-won">WINNER</span>
                  </>
                ) : (
                  <>
                    <span className="open-arrow">→</span>
                    <span className="badge badge-open">OPEN</span>
                  </>
                )}
              </div>

              {!isLocked && <div className="event-card-glow" />}
            </div>
          );
        })}
      </div>

      {/* ── Recent winners quick list ─────────────────────────────────────── */}
      {wonCount > 0 && (
        <div className="recent-winners animate-in">
          <div className="section-title">Recent Winners</div>
          <div className="winners-quick-list">
            {events
              .filter(e => e.winner)
              .slice(-5)
              .map(e => (
                <div key={e.eventNumber} className="winner-quick-item">
                  <div className="winner-quick-left">
                    <span className="winner-event-tag">Draw {e.eventNumber}</span>
                    <span className="winner-quick-name">{e.winner.customerName}</span>
                  </div>
                  <span className="winner-quick-code">{e.winner.couponCode}</span>
                </div>
              ))}
            <button
              className="btn btn-outline view-all-btn"
              onClick={() => navigate('/winners')}
            >
              View All Winners →
            </button>
          </div>
        </div>
      )}

      {/* ── Restart Confirmation Modal ────────────────────────────────────── */}
      {showRestartModal && (
        <div
          className="restart-modal-overlay"
          onClick={e => e.target === e.currentTarget && !restarting && setShowRestartModal(false)}
        >
          <div className="restart-modal animate-in">
            {/* Warning icon */}
            <div className="restart-modal-icon">
              <span>⚠</span>
            </div>

            <h2 className="restart-modal-title">Restart Event</h2>

            <p className="restart-modal-body">
              Are you sure you want to restart the event sequence?
            </p>

            <div className="restart-modal-warning">
              <ul>
                <li>All <strong>{wonCount}</strong> winner record(s) will be permanently cleared</li>
                <li>Events 2–26 will be locked again</li>
                <li>Event 1 will reset to <strong>OPEN</strong></li>
                <li>Coupon data will <strong>not</strong> be affected</li>
              </ul>
            </div>

            <p className="restart-modal-confirm-text">
              This action cannot be undone.
            </p>

            <div className="restart-modal-actions">
              <button
                className="btn btn-outline restart-cancel-btn"
                onClick={() => setShowRestartModal(false)}
                disabled={restarting}
              >
                Cancel
              </button>
              <button
                className="btn btn-restart-confirm"
                onClick={handleRestart}
                disabled={restarting}
              >
                {restarting ? (
                  <>
                    <div className="btn-spinner-dark" />
                    Restarting...
                  </>
                ) : (
                  '↺ Yes, Restart'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

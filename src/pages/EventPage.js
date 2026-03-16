import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './EventPage.css';

export default function EventPage() {
  const { eventNumber } = useParams();
  const navigate = useNavigate();
  const [event,        setEvent]        = useState(null);
  const [couponCount,  setCouponCount]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [revealing,    setRevealing]    = useState(false);
  const [resetting,    setResetting]    = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { fetchEvent(); }, [eventNumber]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/events/${eventNumber}`);
      setEvent(data.event);
      setCouponCount(data.couponCount);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load event');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ── Reveal ────────────────────────────────────────────────────────────────
  const handleReveal = async () => {
    if (couponCount === 0)
      return toast.warning('No coupons imported. Please import coupon data first.');
    setRevealing(true);
    try {
      // fetch winner and all coupons at the same time
      const [revealRes, couponsRes] = await Promise.all([
        api.post(`/api/events/reveal/${eventNumber}`),
        api.get('/api/coupons')
      ]);

      const winner     = revealRes.data.winner;
      const allCoupons = couponsRes.data.coupons || [];
      const couponCodes = allCoupons.map(c => c.couponCode);

      navigate('/winner-reveal', {
        state: {
          winner,
          eventNum: parseInt(eventNumber),
          coupons: couponCodes      // pass real coupon codes for shuffle
        }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reveal winner');
      setRevealing(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setResetting(true);
    try {
      await api.post(`/api/events/reset/${eventNumber}`);
      toast.success(`Event ${eventNumber} has been reset`);
      setConfirmReset(false);
      await fetchEvent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset event');
    } finally {
      setResetting(false);
    }
  };

  // ── View existing winner ──────────────────────────────────────────────────
  const handleViewWinner = async () => {
    if (!event?.winner) return;
    try {
      const couponsRes  = await api.get('/api/coupons');
      const allCoupons  = couponsRes.data.coupons || [];
      const couponCodes = allCoupons.map(c => c.couponCode);
      navigate('/winner-reveal', {
        state: {
          winner: event.winner,
          eventNum: parseInt(eventNumber),
          coupons: couponCodes
        }
      });
    } catch {
      navigate('/winner-reveal', {
        state: { winner: event.winner, eventNum: parseInt(eventNumber), coupons: [] }
      });
    }
  };

  if (loading) return (
    <div className="page">
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  if (!event) return null;

  const evNum     = parseInt(eventNumber);
  const hasWinner = !!event.winner;

  return (
    <div className="page">
      <div className="event-page-header animate-in">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="event-page-title">
          <div className="event-page-num">
            <span>Draw</span>
            <span className="big-num">{String(evNum).padStart(2, '0')}</span>
          </div>
          <div>
            <h1>Lucky Draw</h1>
            <p className="event-subtitle">{couponCount.toLocaleString()} coupons in pool</p>
          </div>
        </div>
      </div>

      {!event.isUnlocked ? (
        <div className="locked-banner animate-in">
          <div className="locked-icon">🔒</div>
          <h2>Event Locked</h2>
          <p>This event will unlock after Event {evNum - 1} winner is revealed.</p>
        </div>
      ) : (
        <div className="event-content">
          {hasWinner ? (
            <div className="winner-revealed-card animate-in">
              <div className="winner-revealed-header">
                <span className="trophy-icon">🏆</span>
                <div>
                  <h2>Winner Revealed</h2>
                  <span className="badge badge-won">EVENT {evNum}</span>
                </div>
              </div>

              <div className="winner-info-grid">
                <div className="winner-info-item highlight">
                  <span className="info-label">Coupon Code</span>
                  <span className="info-value code-value">{event.winner.couponCode}</span>
                </div>
                <div className="winner-info-item">
                  <span className="info-label">Customer Name</span>
                  <span className="info-value">{event.winner.customerName}</span>
                </div>
                <div className="winner-info-item">
                  <span className="info-label">Vehicle Number</span>
                  <span className="info-value">{event.winner.vehicleNumber}</span>
                </div>
                <div className="winner-info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{event.winner.customerPhone}</span>
                </div>
                <div className="winner-info-item">
                  <span className="info-label">Revealed At</span>
                  <span className="info-value">{new Date(event.winner.revealedAt).toLocaleString()}</span>
                </div>
                {event.winner.prizeName && (
                  <div className="winner-info-item prize-highlight">
                    <span className="info-label">🏆 Prize Won</span>
                    <span className="info-value prize-value">{event.winner.prizeName}</span>
                  </div>
                )}
              </div>

              <div className="event-actions">
                <button
                  className={`btn ${confirmReset ? 'btn-danger' : 'btn-outline'}`}
                  onClick={handleReset}
                  disabled={resetting}
                >
                  {resetting ? 'Resetting...' : confirmReset ? '⚠ Confirm Reset?' : '↺ Reset Event'}
                </button>
                <button className="btn btn-gold" onClick={handleViewWinner}>
                  🏆 View Winner Page
                </button>
              </div>
            </div>

          ) : (
            <div className="reveal-card animate-in">
              <div className="reveal-card-bg">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`reveal-orb orb-r${i + 1}`} />
                ))}
              </div>
              <div className="reveal-card-content">
                <div className="reveal-icon">🎯</div>
                <h2 className="reveal-title">Ready to Draw</h2>
                <p className="reveal-desc">
                  Click below to randomly select a winner from{' '}
                  <strong>{couponCount.toLocaleString()}</strong> eligible coupons.
                </p>
                {event?.prize && (
                  <div className="event-prize-preview">
                    <span className="prize-preview-label">🎁 Prize for this event:</span>
                    <span className="prize-preview-name">{event.prize.prizeName}</span>
                  </div>
                )}
                <button
                  className="btn btn-gold reveal-main-btn"
                  onClick={handleReveal}
                  disabled={revealing || couponCount === 0}
                >
                  {revealing ? (
                    <><div className="btn-spinner" /> Selecting Winner...</>
                  ) : (
                    '🎯 Reveal Winner'
                  )}
                </button>
                {couponCount === 0 && (
                  <p className="reveal-warning">⚠ Import coupon data before revealing a winner.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="event-nav animate-in">
        <button
          className="btn btn-outline"
          disabled={evNum <= 1}
          onClick={() => navigate(`/event/${evNum - 1}`)}
        >
          ← Event {evNum - 1}
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          All Events
        </button>
        <button
          className="btn btn-outline"
          disabled={evNum >= 26}
          onClick={() => navigate(`/event/${evNum + 1}`)}
        >
          Event {evNum + 1} →
        </button>
      </div>
    </div>
  );
}
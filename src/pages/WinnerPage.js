import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './WinnerPage.css';

const PRIZE_IMAGES = {
  'dinner-set.svg': require('../assets/prizes/prize_dinner_set.jpg'),
  'led-tv.svg':     require('../assets/prizes/prize_led_tv.jpeg'),
  'fridge.svg':     require('../assets/prizes/prize_fridge.png'),
  'bike.svg':       require('../assets/prizes/prize_bike.png'),
};

const getPrizeImage = (filename) =>
  PRIZE_IMAGES[filename] || PRIZE_IMAGES['dinner-set.svg'];

// ─── Confetti ─────────────────────────────────────────────────────────────────
function launchConfetti() {
  const colors = ['#1b2a4a', '#d4a017', '#1db954', '#ffffff', '#f0c040', '#4a7aff', '#ffd700'];
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = Array.from({ length: 250 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 10 + 3,
    d: Math.random() * 60 + 20,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngle: Math.random() * Math.PI * 2,
    tiltSpeed: Math.random() * 0.12 + 0.04,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));
  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    particles.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y += (Math.cos(frame / 20 + p.d) + p.r / 2) * 1.8;
      p.tilt = Math.sin(p.tiltAngle) * 15;
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      if (p.shape === 'circle') {
        ctx.arc(p.x + p.tilt, p.y, p.r / 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else {
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      }
      if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
    });
    if (frame < 350) requestAnimationFrame(animate);
    else canvas.remove();
  };
  animate();
}

// ─── Beep ─────────────────────────────────────────────────────────────────────
function playBeep(audioCtx, isLast = false) {
  try {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = isLast ? 880 : 440;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
}

export default function WinnerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const winner   = location.state?.winner;
  const eventNum = location.state?.eventNum;
  const coupons  = location.state?.coupons || [];

  // phases: countdown → popup (shuffling) → done
  const [phase,       setPhase]       = useState('countdown');
  const [count,       setCount]       = useState(3);
  const [shuffleCode, setShuffleCode] = useState('HPCL-XXXXXXXX');

  const countdownRef = useRef(null);
  const shuffleRef   = useRef(null);
  const audioCtxRef  = useRef(null);

  useEffect(() => {
    if (!winner) { navigate('/dashboard'); return; }

    setPhase('countdown');
    setCount(3);
    setShuffleCode('HPCL-XXXXXXXX');

    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current.resume();

    let current = 3;

    // Step 1: countdown 3 → 1
    countdownRef.current = setInterval(() => {
      current -= 1;
      setCount(current);
      playBeep(audioCtxRef.current, current === 1);

      if (current <= 0) {
        clearInterval(countdownRef.current);

        // Step 2: show popup immediately, then start shuffle after 300ms
        setPhase('popup');

        const delay = setTimeout(() => {
          let n = 0;
          // use coupons from closure directly — they are available here
          const list = coupons.length > 0 ? coupons : ['HPCL-000001', 'HPCL-000002'];

          shuffleRef.current = setInterval(() => {
            n += 1;
            // pick random coupon from real list
            const randomCode = list[Math.floor(Math.random() * list.length)];
            setShuffleCode(randomCode);

            if (n >= 20) {
              clearInterval(shuffleRef.current);
              setShuffleCode(winner.couponCode); // land on real winner
              setPhase('done');
              launchConfetti();
            }
          }, 120);
        }, 300);

        // store delay ref for cleanup
        shuffleRef._delay = delay;
      }
    }, 900);

    return () => {
      clearInterval(countdownRef.current);
      clearInterval(shuffleRef.current);
      clearTimeout(shuffleRef._delay);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [winner]);   // single useEffect — coupons accessed from closure

  if (!winner) return null;

  const prizeImgSrc = getPrizeImage(winner.prizeImage);
  const isBike      = winner.prizeName === 'Bike';
  const handleClose = () => navigate(`/event/${eventNum || 1}`);

  return (
    <div className="winner-page">
      <div className="winner-page-bg" />
      <div className={`winner-page-overlay ${isBike ? 'grand' : ''}`} />

      <div className="wp-particles">
        {[...Array(16)].map((_, i) => (
          <div key={i} className={`wp-particle wpp${i + 1}`} />
        ))}
      </div>

      {/* ══ COUNTDOWN ══ */}
      {phase === 'countdown' && (
        <div className="wp-countdown">
          <div className="wp-countdown-rings">
            <div className="wc-ring wcr1" />
            <div className="wc-ring wcr2" />
            <div className="wc-ring wcr3" />
          </div>
          <div className="wp-countdown-center">
            <span className="wp-count-num" key={count}>{count}</span>
            <span className="wp-count-label">🎰 Selecting Winner...</span>
          </div>
          <p className="wp-event-tag">Draw {String(eventNum).padStart(2, '0')}</p>
        </div>
      )}

      {/* ══ POPUP — shown during shuffle and after ══ */}
      {(phase === 'popup' || phase === 'done') && (
        <div className="wp-result animate-in">

          <div className="wp-header">
            <div className="wp-fireworks">{phase === 'done' ? '🎉' : '🎰'}</div>
            <h1 className="wp-congrats">
              {phase === 'done' ? 'CONGRATULATIONS!' : 'SELECTING WINNER...'}
            </h1>
            <div className="wp-divider" />
            <p className="wp-event-badge">Draw {String(eventNum).padStart(2, '0')} WINNER</p>
          </div>

          {/* Coupon box — shows real coupons shuffling, then winner code */}
          <div className="wp-coupon-box">
            <span className="wp-coupon-label">WINNING COUPON CODE</span>
            <div
              className="wp-coupon-code"
              style={phase === 'popup' ? { color: '#d4a017', letterSpacing: '3px' } : {}}
            >
              {shuffleCode}
            </div>
          </div>

          {/* Details — only after shuffle finishes */}
          {phase === 'done' && (
            <>
              <div className="wp-details-grid">
                <div className="wp-detail-card">
                  <span className="wp-detail-icon">👤</span>
                  <div>
                    <span className="wp-detail-label">Customer Name</span>
                    <span className="wp-detail-value">{winner.customerName}</span>
                  </div>
                </div>
                <div className="wp-detail-card">
                  <span className="wp-detail-icon">🚗</span>
                  <div>
                    <span className="wp-detail-label">Vehicle Number</span>
                    <span className="wp-detail-value">{winner.vehicleNumber}</span>
                  </div>
                </div>
                <div className="wp-detail-card">
                  <span className="wp-detail-icon">📞</span>
                  <div>
                    <span className="wp-detail-label">Phone</span>
                    <span className="wp-detail-value">{winner.customerPhone}</span>
                  </div>
                </div>
                <div className="wp-detail-card">
                  <span className="wp-detail-icon">⛽</span>
                  <div>
                    <span className="wp-detail-label">Pump Name</span>
                    <span className="wp-detail-value">{winner.pumpName}</span>
                  </div>
                </div>
                <div className="wp-detail-card wp-detail-wide">
                  <span className="wp-detail-icon">📍</span>
                  <div>
                    <span className="wp-detail-label">Sales Area</span>
                    <span className="wp-detail-value">{winner.salesArea}</span>
                  </div>
                </div>
              </div>

              <div className={`wp-prize-box ${isBike ? 'grand-prize-box' : ''}`}>
                <span className="wp-prize-label">🏆 PRIZE WON</span>
                <span className={`wp-prize-name ${isBike ? 'prize-grand' : ''}`}>
                  {winner.prizeName}
                </span>
                <div className="wp-prize-img-wrap">
                  <img src={prizeImgSrc} alt={winner.prizeName} className="wp-prize-img" />
                </div>
              </div>

              <button className="wp-close-btn" onClick={handleClose}>
                ✓ Save &amp; Back to Event
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
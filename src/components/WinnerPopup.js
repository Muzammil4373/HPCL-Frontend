import React, { useEffect, useRef, useState } from 'react';
import './WinnerPopup.css';

const PRIZE_IMAGES = {
  'dinner-set.svg': require('../assets/prizes/prize_dinner_set.jpg'),
  'led-tv.svg':     require('../assets/prizes/prize_led_tv.jpeg'),
  'fridge.svg':     require('../assets/prizes/prize_fridge.png'),
  'bike.svg':       require('../assets/prizes/prize_bike.png'),
};

const getPrizeImage = (filename) =>
  PRIZE_IMAGES[filename] || PRIZE_IMAGES['dinner-set.svg'];

// ─── Confetti ────────────────────────────────────────────────────────────────
function launchConfetti() {
  const colors = ['#c8102e', '#e8a020', '#1db954', '#ffffff', '#ffdd00', '#ff6b6b', '#ffd700'];
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 220 }, () => ({
    x:         Math.random() * canvas.width,
    y:         Math.random() * canvas.height - canvas.height,
    r:         Math.random() * 9 + 3,
    d:         Math.random() * 60 + 20,
    color:     colors[Math.floor(Math.random() * colors.length)],
    tilt:      Math.random() * 10 - 10,
    tiltAngle: Math.random() * Math.PI * 2,
    tiltSpeed: Math.random() * 0.12 + 0.04,
    shape:     Math.random() > 0.5 ? 'circle' : 'rect',
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
      ctx.lineWidth   = p.r;
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
      if (p.y > canvas.height) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    });
    if (frame < 300) requestAnimationFrame(animate);
    else canvas.remove();
  };
  animate();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WinnerPopup({ winner, onClose }) {
  const [phase,       setPhase]       = useState('countdown');
  const [count,       setCount]       = useState(6);
  const [shuffleCode, setShuffleCode] = useState('HP-XXXXXXXX');

  const countdownRef  = useRef(null);
  const shuffleRef    = useRef(null);

  // ─── random code generator ─────────────────────────────────────────────────
  const makeRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let code = 'HP-';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  useEffect(() => {
    if (!winner) return;

    // reset everything
    setPhase('countdown');
    setCount(6);
    setShuffleCode('HP-XXXXXXXX');

    let current = 6;

    // ── Step 1: countdown 6 → 1 ──────────────────────────────────────────────
    countdownRef.current = setInterval(() => {
      current -= 1;
      setCount(current);

      if (current <= 0) {
        clearInterval(countdownRef.current);

        // ── Step 2: shuffle random codes ──────────────────────────────────────
        setPhase('shuffling');
        let n = 0;
        shuffleRef.current = setInterval(() => {
          n += 1;
          setShuffleCode(makeRandomCode());
          if (n >= 20) {
            clearInterval(shuffleRef.current);
            // ── Step 3: show winner ─────────────────────────────────────────
            setShuffleCode(winner.couponCode);
            setPhase('shown');
            launchConfetti();
          }
        }, 100);
      }
    }, 900);

    return () => {
      clearInterval(countdownRef.current);
      clearInterval(shuffleRef.current);
    };
  }, [winner]);

  if (!winner) return null;

  const prizeImgSrc = getPrizeImage(winner.prizeImage);
  const isBike      = winner.prizeName === 'Bike';

  return (
    <div
      className="popup-overlay"
      onClick={e => e.target === e.currentTarget && phase === 'shown' && onClose()}
    >
      <div className={`popup-modal ${phase} ${isBike ? 'grand-prize' : ''}`}>

        {/* Floating particles */}
        <div className="popup-particles">
          {[...Array(14)].map((_, i) => <div key={i} className={`particle p${i + 1}`} />)}
        </div>

        {/* ══ COUNTDOWN ══ */}
        {phase === 'countdown' && (
          <div className="countdown-phase">
            <div className="countdown-rings">
              <div className="c-ring cr1" />
              <div className="c-ring cr2" />
              <div className="c-ring cr3" />
            </div>
            <div className="countdown-center">
              <span className="countdown-number" key={count}>{count}</span>
              <span className="countdown-label">Get Ready...</span>
            </div>
          </div>
        )}

        {/* ══ SHUFFLING ══ */}
        {phase === 'shuffling' && (
          <div className="countdown-phase">
            <div className="countdown-rings">
              <div className="c-ring cr1" />
              <div className="c-ring cr2" />
              <div className="c-ring cr3" />
            </div>
            <div className="countdown-center">
              <span
                className="countdown-number"
                style={{ fontSize: '18px', letterSpacing: '3px', color: '#d4a017' }}
              >
                {shuffleCode}
              </span>
              <span className="countdown-label">🎰 Selecting Winner...</span>
            </div>
          </div>
        )}

        {/* ══ SHOWN ══ */}
        {phase === 'shown' && (
          <div className="reveal-phase">
            <div className="popup-fireworks">🎉</div>
            <h2 className="congrats-title">CONGRATULATIONS!</h2>
            <div className="popup-divider" />

            <div className="coupon-display">
              <span className="coupon-label">WINNING COUPON CODE</span>
              <div className="coupon-code final">{winner.couponCode}</div>
            </div>

            <div className="winner-details">
              <div className="detail-row">
                <span className="detail-icon">👤</span>
                <div>
                  <span className="detail-label">Customer Name</span>
                  <span className="detail-value">{winner.customerName}</span>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-icon">🚗</span>
                <div>
                  <span className="detail-label">Vehicle Number</span>
                  <span className="detail-value">{winner.vehicleNumber}</span>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📞</span>
                <div>
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{winner.customerPhone}</span>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-icon">⛽</span>
                <div>
                  <span className="detail-label">Pump Name</span>
                  <span className="detail-value">{winner.pumpName}</span>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-icon">📍</span>
                <div>
                  <span className="detail-label">Sales Area</span>
                  <span className="detail-value">{winner.salesArea}</span>
                </div>
              </div>
            </div>

            <div className={`prize-section ${isBike ? 'grand' : ''}`}>
              <span className="prize-won-label">🏆 PRIZE WON</span>
              <span className={`prize-name-badge ${isBike ? 'prize-bike' : ''}`}>
                {winner.prizeName}
              </span>
              <div className="prize-image-wrap">
                <img src={prizeImgSrc} alt={winner.prizeName} className="prize-image" />
              </div>
            </div>

            <button className="btn btn-gold popup-close-btn" onClick={onClose}>
              Save &amp; Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

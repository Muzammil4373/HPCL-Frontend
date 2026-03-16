import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import api from '../utils/api';
import './WinnersPage.css';

const TOTAL_EVENTS = 26;

const getPrizeName = (eventNumber) => {
  if (eventNumber <= 20)                      return 'Dinner Set';
  if (eventNumber >= 21 && eventNumber <= 23) return 'LED TV';
  if (eventNumber >= 24 && eventNumber <= 25) return 'Fridge';
  if (eventNumber === 26)                     return 'Bike 🏍️';
  return 'Prize';
};

const PRIZE_COLORS = {
  'Dinner Set': { bg: 'rgba(245,166,35,0.1)',  border: 'rgba(245,166,35,0.3)',  color: '#f5a623' },
  'LED TV':     { bg: 'rgba(0,112,210,0.1)',   border: 'rgba(0,112,210,0.3)',   color: '#0070d2' },
  'Fridge':     { bg: 'rgba(0,200,81,0.1)',    border: 'rgba(0,200,81,0.3)',    color: '#00c851' },
  'Bike 🏍️':   { bg: 'rgba(255,68,68,0.12)',  border: 'rgba(255,68,68,0.35)', color: '#ff4444' },
};

export default function WinnersPage() {
  const [winners,    setWinners]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/winners')
      .then(({ data }) => setWinners(data.winners))
      .catch(() => toast.error('Failed to load winners'))
      .finally(() => setLoading(false));
  }, []);

  // ── Export to Excel ────────────────────────────────────────────────────────
  const handleExport = () => {
    if (winners.length === 0) return toast.warning('No winners to export.');
    setExporting(true);
    try {
      // Build rows
      const rows = winners.map(w => ({
        'Event No.':     String(w.eventNumber).padStart(2, '0'),
        'Prize':         w.prizeName || getPrizeName(w.eventNumber),
        'Coupon Code':   w.couponCode,
        'Customer Name': w.customerName,
        'Vehicle No.':   w.vehicleNumber,
        'Phone':         w.customerPhone,
        'Pump Name':     w.pumpName,
        'Sales Area':    w.salesArea,
        'Revealed At':   new Date(w.revealedAt).toLocaleString(),
      }));

      const worksheet  = XLSX.utils.json_to_sheet(rows);
      const workbook   = XLSX.utils.book_new();

      // Set column widths
      worksheet['!cols'] = [
        { wch: 10 }, // Event No.
        { wch: 14 }, // Prize
        { wch: 18 }, // Coupon Code
        { wch: 22 }, // Customer Name
        { wch: 16 }, // Vehicle No.
        { wch: 16 }, // Phone
        { wch: 22 }, // Pump Name
        { wch: 18 }, // Sales Area
        { wch: 22 }, // Revealed At
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Winners');

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `HP_Lucky_Draw_Winners_${date}.xlsx`);
      toast.success('Winners list exported successfully!');
    } catch (err) {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="page">
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="winners-header animate-in">
        <div>
          <p className="section-title" style={{ marginBottom: 4 }}>HPCL Lucky Draw</p>
          <h1 className="winners-title">Winners List</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Export button */}
          {winners.length > 0 && (
            <button
              className="btn-export"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <><span className="export-spinner" /> Exporting...</>
              ) : (
                <>⬇ Export Excel</>
              )}
            </button>
          )}

          <div className="winners-count">
            <span className="count-num">{winners.length}</span>
            <span className="count-label">/ {TOTAL_EVENTS} Events</span>
          </div>
        </div>
      </div>

      {winners.length === 0 ? (
        <div className="no-winners animate-in">
          <div className="no-winners-icon">🏆</div>
          <h2>No Winners Yet</h2>
          <p>Winners will appear here after events are revealed.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="winners-table-wrap animate-in">
          <table className="winners-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Prize</th>
                <th>Coupon Code</th>
                <th>Customer Name</th>
                <th>Vehicle No.</th>
                <th>Phone</th>
                <th>Pump</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w, i) => {
                const pname  = w.prizeName || getPrizeName(w.eventNumber);
                const pkey   = pname.replace(' 🏍️', '') === 'Bike' ? 'Bike 🏍️' : pname;
                const pStyle = PRIZE_COLORS[pkey] || PRIZE_COLORS['Dinner Set'];
                return (
                  <tr key={w._id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <td>
                      <div className="event-cell">
                        <span className="event-cell-num">{String(w.eventNumber).padStart(2, '0')}</span>
                        <span className="event-cell-label">Event</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="prize-badge-cell"
                        style={{ background: pStyle.bg, border: `1px solid ${pStyle.border}`, color: pStyle.color, width: 75 }}
                      >
                        {pname}
                      </span>
                    </td>
                    <td><span className="coupon-cell">{w.couponCode}</span></td>
                    <td className="name-cell">{w.customerName}</td>
                    <td className="vehicle-cell">{w.vehicleNumber}</td>
                    <td className="phone-cell">{w.customerPhone}</td>
                    <td className="pump-cell">{w.pumpName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Event completion dots */}
      {winners.length > 0 && (
        <div className="completion-grid animate-in">
          <p className="section-title">All {TOTAL_EVENTS} Events</p>
          <div className="event-dots">
            {Array.from({ length: TOTAL_EVENTS }, (_, i) => {
              const won    = winners.find(w => w.eventNumber === i + 1);
              const pname  = won ? (won.prizeName || getPrizeName(i + 1)) : '';
              const pkey   = pname.replace(' 🏍️', '') === 'Bike' ? 'Bike 🏍️' : pname;
              const pStyle = won ? (PRIZE_COLORS[pkey] || PRIZE_COLORS['Dinner Set']) : null;
              return (
                <div
                  key={i}
                  className={`event-dot ${won ? 'dot-won' : 'dot-empty'}`}
                  style={won ? { borderColor: pStyle.border, background: pStyle.bg } : {}}
                  onClick={() => navigate(`/event/${i + 1}`)}
                  title={won ? `Event ${i + 1}: ${pname} — ${won.couponCode}` : `Event ${i + 1}: Pending`}
                >
                  <span style={won ? { color: pStyle.color } : {}}>{String(i + 1).padStart(2, '0')}</span>
                  {won && <div className="dot-check" style={{ color: pStyle.color }}>✓</div>}
                </div>
              );
            })}
          </div>
          <div className="prize-legend">
            {Object.entries(PRIZE_COLORS).map(([name, style]) => (
              <div key={name} className="legend-item">
                <span className="legend-dot" style={{ background: style.color }} />
                <span className="legend-label">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
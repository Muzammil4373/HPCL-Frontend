import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './ImportPage.css';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [couponCount, setCouponCount] = useState(0);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/api/coupons')
      .then(({ data }) => setCouponCount(data.count))
      .catch(() => {});
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  };

  const validateAndSet = (f) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast.error('Only Excel files (.xlsx, .xls) are accepted');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/api/coupons/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(data);
      setCouponCount(prev => prev + data.imported);
      toast.success(data.message);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setResult(err.response?.data);
    } finally {
      setUploading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL coupon records? This cannot be undone.')) return;
    try {
      await api.delete('/api/coupons');
      setCouponCount(0);
      toast.success('All coupons cleared');
    } catch {
      toast.error('Failed to clear coupons');
    }
  };

  return (
    <div className="page">
      <div className="import-header animate-in">
        <div>
          <p className="section-title" style={{marginBottom:4}}>Data Management</p>
          <h1 className="import-title">Import Coupons</h1>
        </div>
        <div className="current-count">
          <span className="count-badge">{couponCount.toLocaleString()}</span>
          <span className="count-text">coupons in database</span>
        </div>
      </div>

      {/* Format guide */}
      <div className="format-guide animate-in">
        <div className="format-guide-header">
          <span className="format-icon">📋</span>
          <h3>Required Excel Format</h3>
        </div>
        <div className="columns-list">
          {['CustomerName', 'CustomerPhone', 'VehicleNumber', 'CouponCode'].map(col => (
            <div key={col} className="column-chip">
              <span className="col-dot" />
              {col}
            </div>
          ))}
        </div>
        <p className="format-note">
          Column headers must match exactly (case-sensitive). PumpName is automatically set from your account.
          Duplicate coupon codes will be skipped.
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`drop-zone animate-in ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileRef.current.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          style={{display:'none'}}
          onChange={e => e.target.files[0] && validateAndSet(e.target.files[0])}
        />

        {file ? (
          <div className="file-selected">
            <div className="file-icon">📊</div>
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button className="remove-file" onClick={e => { e.stopPropagation(); setFile(null); }}>✕</button>
          </div>
        ) : (
          <div className="drop-content">
            <div className="drop-icon">📁</div>
            <p className="drop-title">{dragging ? 'Drop file here' : 'Drag & Drop Excel File'}</p>
            <p className="drop-sub">or click to browse — .xlsx or .xls</p>
          </div>
        )}
      </div>

      <div className="import-actions animate-in">
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{flex:1, maxWidth: 320}}
        >
          {uploading ? <><div className="btn-spinner"/> Importing...</> : '↑ Import Excel File'}
        </button>
        {couponCount > 0 && (
          <button className="btn btn-danger" onClick={handleClearAll}>
            🗑 Clear All Coupons
          </button>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`import-result animate-in ${result.success ? 'success' : 'error'}`}>
          <div className="result-header">
            <span className="result-icon">{result.success ? '✅' : '❌'}</span>
            <span className="result-message">{result.message}</span>
          </div>
          {result.success && (
            <div className="result-stats">
              <div className="result-stat">
                <span className="rstat-num" style={{color:'#00c851'}}>{result.imported}</span>
                <span className="rstat-label">Imported</span>
              </div>
              <div className="result-stat">
                <span className="rstat-num" style={{color:'#f5a623'}}>{result.duplicates}</span>
                <span className="rstat-label">Duplicates Skipped</span>
              </div>
            </div>
          )}
          {result.errors?.length > 0 && (
            <div className="result-errors">
              <p className="error-title">Validation Issues:</p>
              {result.errors.map((err, i) => <p key={i} className="error-item">• {err}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Sample download hint */}
      <div className="sample-hint animate-in">
        <span>💡</span>
        <div>
          <strong>Sample Excel Headers:</strong>
          <code> CustomerName | CustomerPhone | VehicleNumber | CouponCode</code>
        </div>
      </div>
    </div>
  );
}

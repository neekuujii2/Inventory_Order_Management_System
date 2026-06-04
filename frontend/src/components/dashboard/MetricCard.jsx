import React from 'react';
import './MetricCard.css';

export default function MetricCard({ label, value, subtext, icon, type = 'info' }) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <div className={`metric-card-icon-container ${type}`} aria-hidden="true">
          {icon}
        </div>
        <span className="metric-card-label">{label}</span>
      </div>
      <div className="metric-card-value">{value}</div>
      {subtext && <div className="metric-card-subtext">{subtext}</div>}
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';

import './MetricCard.css';

export default function MetricCard({ label, value, subtext, icon, type = 'info', trend }) {
  return (
    <motion.div
      className={`metric-card metric-card--${type}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="metric-card__header">
        <div className="metric-card__icon">{icon}</div>
        {trend ? <span className="glass-pill">{trend}</span> : null}
      </div>
      <strong className="metric-card__value">{value}</strong>
      <span className="metric-card__label">{label}</span>
      {subtext ? <p className="metric-card__subtext">{subtext}</p> : null}
    </motion.div>
  );
}

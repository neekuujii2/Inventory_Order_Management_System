import React from 'react';
import './Badge.css';

export default function Badge({ variant = 'info', children }) {
  const isLowStock = variant === 'low-stock';
  
  return (
    <span className={`badge badge-${variant}`}>
      {isLowStock && <span aria-hidden="true">⚠️</span>}
      {children}
    </span>
  );
}

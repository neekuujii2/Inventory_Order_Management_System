import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Slash } from 'lucide-react';

import './Badge.css';

const iconMap = {
  pending: Clock3,
  fulfilled: CheckCircle2,
  cancelled: Slash,
  'low-stock': AlertTriangle,
};

export default function Badge({ variant = 'info', children }) {
  const Icon = iconMap[variant];

  return (
    <span className={`badge badge-${variant}`}>
      {Icon ? <Icon size={14} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

import React from 'react';
import { motion } from 'framer-motion';

import './Button.css';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  onClick,
  ...props
}) {
  return (
    <motion.button
      whileHover={disabled || loading ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      <span className="btn-ripple" aria-hidden="true" />
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : icon ? <span className="btn-icon">{icon}</span> : null}
      <span className="btn-label">{children}</span>
    </motion.button>
  );
}

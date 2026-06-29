import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

import './Footer.css';

export default function Footer() {
  return (
    <footer className="shell-footer container">
      <div className="shell-footer__card">
        <div>
          <strong>Atlas Inventory Platform</strong>
          <span>Operational intelligence for purchasing, stock control, and order fulfillment.</span>
        </div>
        <div className="shell-footer__meta">
          <span className="glass-pill">
            <ShieldCheck size={14} />
            SOC-ready workflow
          </span>
          <span className="glass-pill">
            <Zap size={14} />
            Real-time dashboard
          </span>
        </div>
      </div>
    </footer>
  );
}

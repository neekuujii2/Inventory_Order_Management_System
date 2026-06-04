import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
          <span className="footer-logo-icon"></span>
          <span>[IMS]</span>
        </div>
        <div className="footer-links">
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <a href="#terms" className="footer-link">Terms of Service</a>
          <a href="#support" className="footer-link">Support</a>
        </div>
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Inventory Management System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

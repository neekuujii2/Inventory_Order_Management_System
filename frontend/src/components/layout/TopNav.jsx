import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './TopNav.css';

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Customers', path: '/customers' },
    { label: 'Orders', path: '/orders' }
  ];

  return (
    <nav className="topnav">
      <div className="topnav-container">
        <Link to="/" className="logo-link" onClick={closeMenu}>
          <span className="logo-icon"></span>
          <div className="logo-text">
            <span className="logo-bracket">[</span>
            <span className="logo-ims">IMS</span>
            <span className="logo-bracket">]</span>
          </div>
          <span className="logo-subtitle">Inventory Management System</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className={`hamburger ${isOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Slide-down Menu */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

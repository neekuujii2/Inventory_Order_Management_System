import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  BarChart2,
  Search,
  Menu,
  X
} from 'lucide-react';
import './TopNav.css';

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
    { label: 'Products', path: '/products', icon: <Package size={16} /> },
    { label: 'Customers', path: '/customers', icon: <Users size={16} /> },
    { label: 'Orders', path: '/orders', icon: <ShoppingCart size={16} /> },
    { label: 'Reports', path: '/reports', icon: <FileText size={16} /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChart2 size={16} /> },
  ];

  return (
    <nav className="topnav">
      <div className="topnav-container">

        {/* LEFT: Logo + Brand */}
        <Link to="/" className="logo-link" onClick={closeMenu}>
          <div className="logo-icon-wrapper">
            <span className="logo-icon-inner" />
          </div>
          <div className="logo-text">
            <span className="logo-ims">IMS</span>
            <span className="logo-subtitle">Inventory Management System</span>
          </div>
        </Link>

        {/* CENTER: Desktop Nav Links */}
        <div className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* RIGHT: Search + Hamburger */}
        <div className="nav-right">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              aria-label="Global search"
            />
            <span className="search-kbd">⌘K</span>
          </div>

          {/* Mobile Hamburger */}
          <button
            className={`hamburger${isOpen ? ' open' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      <div className={`mobile-menu${isOpen ? ' open' : ''}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            onClick={closeMenu}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  MoonStar,
  Package,
  Search,
  ShoppingCart,
  SunMedium,
  Users,
  X,
} from 'lucide-react';

import './TopNav.css';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Orders', path: '/orders', icon: ShoppingCart },
  { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
];

function NavItems({ onNavigate }) {
  return navItems.map(({ label, path, icon: Icon, end }) => (
    <NavLink
      key={path}
      to={path}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `shell-nav__link${isActive ? ' active' : ''}`}
    >
      <span className="shell-nav__icon">
        <Icon size={18} />
      </span>
      <span>{label}</span>
      <ChevronRight size={16} className="shell-nav__chevron" />
    </NavLink>
  ));
}

export default function TopNav({ theme, onToggleTheme, workspaceMeta }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const quickStats = useMemo(
    () => [
      { label: 'Service health', value: '99.94%', tone: 'var(--success)' },
      { label: 'Open alerts', value: '07', tone: 'var(--warning)' },
      { label: 'Automation jobs', value: '12', tone: 'var(--info)' },
    ],
    []
  );

  return (
    <>
      <aside className="shell-nav">
        <div className="shell-brand">
          <div className="shell-brand__mark">
            <Activity size={20} />
          </div>
          <div>
            <strong>Atlas Inventory</strong>
            <span>Enterprise control center</span>
          </div>
        </div>

        <div className="shell-search">
          <Search size={17} />
          <input type="text" placeholder="Search modules, SKUs, orders..." aria-label="Search modules" />
        </div>

        <nav className="shell-nav__list" aria-label="Primary">
          <NavItems />
        </nav>

        <div className="shell-nav__panel">
          <div className="shell-nav__panel-header">
            <span className="glass-pill">
              <span className="status-dot" style={{ background: 'var(--success)' }} />
              {workspaceMeta.syncLabel}
            </span>
          </div>
          <div className="shell-nav__stats">
            {quickStats.map((item) => (
              <div key={item.label} className="shell-nav__stat">
                <span>{item.label}</span>
                <strong style={{ color: item.tone }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <header className="shell-topbar">
        <div className="container shell-topbar__inner">
          <button
            type="button"
            className="shell-icon-btn mobile-only"
            aria-label="Open navigation"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          <div>
            <span className="eyebrow">Operations workspace</span>
            <div className="shell-topbar__title-row">
              <h1>Inventory command center</h1>
              <span className="glass-pill">{workspaceMeta.dateLabel}</span>
            </div>
          </div>

          <div className="shell-topbar__actions">
            <button type="button" className="shell-icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button type="button" className="shell-icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
            <div className="shell-user-chip">
              <div className="shell-user-chip__avatar">IM</div>
              <div>
                <strong>Inventory Ops</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileOpen ? (
          <motion.div
            className="shell-mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="shell-mobile__panel"
              initial={{ x: -32, opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -32, opacity: 0.8 }}
              transition={{ duration: 0.24 }}
            >
              <div className="shell-mobile__header">
                <div className="shell-brand">
                  <div className="shell-brand__mark">
                    <Activity size={20} />
                  </div>
                  <div>
                    <strong>Atlas Inventory</strong>
                    <span>Enterprise control center</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="shell-icon-btn"
                  aria-label="Close navigation"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="shell-search">
                <Search size={17} />
                <input type="text" placeholder="Search modules, SKUs, orders..." aria-label="Search modules" />
              </div>

              <nav className="shell-nav__list shell-nav__list--mobile" aria-label="Mobile primary">
                <NavItems onNavigate={() => setIsMobileOpen(false)} />
              </nav>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

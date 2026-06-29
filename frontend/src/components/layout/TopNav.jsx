import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Package,
  Search,
  ShoppingCart,
  SunMedium,
  Users,
  Warehouse,
  X,
  Layers,
  ArrowLeftRight,
  RotateCcw,
  ClipboardList,
  Settings as SettingsIcon,
  BellRing
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './TopNav.css';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Categories', path: '/categories', icon: Layers },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Suppliers', path: '/suppliers', icon: Users },
  { label: 'Warehouses', path: '/warehouses', icon: Warehouse },
  { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
  { label: 'Stock Transfers', path: '/transfers', icon: ArrowLeftRight },
  { label: 'Returns', path: '/returns', icon: RotateCcw },
  { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
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
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    refetchInterval: 10000, // Fallback poll 10s
  });

  // Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark All Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  // Setup EventSource for Real-time alerts
  useEffect(() => {
    const sseUrl = `${api.defaults.baseURL || 'http://localhost:8000'}/notifications/stream`;
    const sse = new EventSource(sseUrl);

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'connected' || data.status === 'ping') return;
        
        // Trigger cache invalidation
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        
        // Notify user via toast
        toast((t) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BellRing size={16} style={{ color: 'var(--accent)' }} />
            New system activity received.
          </span>
        ));
      } catch (err) {
        // ignore JSON parse
      }
    };

    sse.onerror = () => {
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [queryClient]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read).length
  , [notifications]);

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

        <nav className="shell-nav__list" aria-label="Primary">
          <NavItems />
        </nav>

        <div className="shell-nav__panel">
          <div className="shell-nav__panel-header">
            <span className="glass-pill">
              <span className="status-dot" style={{ background: 'var(--success)' }} />
              Live channel ready
            </span>
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
            <span className="eyebrow">Enterprise Workspace</span>
            <div className="shell-topbar__title-row">
              <h1>Inventory command center</h1>
              <span className="glass-pill">{workspaceMeta.dateLabel}</span>
            </div>
          </div>

          <div className="shell-topbar__actions">
            {/* Notification bell */}
            <div className="notification-bell-container">
              <button 
                type="button" 
                className={`shell-icon-btn ${unreadCount > 0 ? 'pulse-bell' : ''}`} 
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="notifications-dropdown surface-card"
                  >
                    <div className="noti-header">
                      <strong>Notifications</strong>
                      {unreadCount > 0 && (
                        <button 
                          type="button" 
                          className="mark-all-btn" 
                          onClick={() => markAllReadMutation.mutate()}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="noti-list">
                      {notifications.length === 0 ? (
                        <div className="noti-empty">
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((noti) => (
                          <div 
                            key={noti.id} 
                            className={`noti-item ${noti.is_read ? 'read' : 'unread'}`}
                            onClick={() => !noti.is_read && markReadMutation.mutate(noti.id)}
                          >
                            <span className={`noti-dot ${noti.type}`} />
                            <div className="noti-content">
                              <strong>{noti.title}</strong>
                              <p>{noti.message}</p>
                              <span>{new Date(noti.created_at).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="button" className="shell-icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
            <button type="button" className="shell-icon-btn" onClick={logout} aria-label="Sign out">
              <LogOut size={18} />
            </button>
            <div className="shell-user-chip">
              <div className="shell-user-chip__avatar">{(user?.full_name || 'IM').slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{user?.full_name || 'Inventory Ops'}</strong>
                <span className="role-label">{user?.role ? user.role.toUpperCase().replace(/_/g, ' ') : 'Viewer'}</span>
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

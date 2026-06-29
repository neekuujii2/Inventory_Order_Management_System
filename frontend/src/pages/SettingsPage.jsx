import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Database, Globe, Lock, Palette, Plus, Save, Settings, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { getSettings, setSetting } from '../services/settings';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

function FormField({ label, error, children }) {
  return (
    <div className="form-group">
      {children}
      <span className="floating-label">{label}</span>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

const DEFAULT_SETTINGS_GROUPS = [
  {
    title: 'General',
    icon: Globe,
    keys: ['company_name', 'company_email', 'timezone', 'currency'],
    descriptions: {
      company_name: 'Organization display name used in reports and invoices.',
      company_email: 'Primary contact email for the organization.',
      timezone: 'Default timezone for date/time display.',
      currency: 'Default currency for financial calculations.',
    },
  },
  {
    title: 'Security',
    icon: Shield,
    keys: ['session_timeout_minutes', 'max_login_attempts', 'password_min_length', 'mfa_enabled'],
    descriptions: {
      session_timeout_minutes: 'Minutes of inactivity before session expires.',
      max_login_attempts: 'Max failed login attempts before account lockout.',
      password_min_length: 'Minimum password length requirement.',
      mfa_enabled: 'Enable multi-factor authentication (true/false).',
    },
  },
  {
    title: 'Inventory',
    icon: Database,
    keys: ['low_stock_threshold', 'auto_reorder_enabled', 'default_warehouse_code', 'barcode_format'],
    descriptions: {
      low_stock_threshold: 'Quantity at which products are flagged as low stock.',
      auto_reorder_enabled: 'Automatically create POs when stock falls below threshold (true/false).',
      default_warehouse_code: 'Default warehouse code for incoming stock.',
      barcode_format: 'Barcode format standard (CODE128, EAN13, UPC-A, etc.).',
    },
  },
  {
    title: 'Appearance',
    icon: Palette,
    keys: ['theme_mode', 'sidebar_collapsed', 'rows_per_page'],
    descriptions: {
      theme_mode: 'Default UI theme (light/dark/system).',
      sidebar_collapsed: 'Whether sidebar starts collapsed (true/false).',
      rows_per_page: 'Default number of rows shown in data tables.',
    },
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const settingsMap = useMemo(() => {
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return map;
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: setSetting,
    onSuccess: (d) => {
      toast.success(`Setting "${d.key}" saved`);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: setSetting,
    onSuccess: (d) => {
      toast.success(`Setting "${d.key}" created`);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsAddOpen(false);
      reset();
    },
    onError: (e) => toast.error(e.message),
  });

  const [editingValues, setEditingValues] = useState({});

  const handleValueChange = (key, value) => {
    setEditingValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (key) => {
    const value = editingValues[key] !== undefined ? editingValues[key] : settingsMap[key];
    if (value !== undefined) {
      saveMut.mutate({ key, value });
    }
  };

  const isAdmin = user?.role && ['super_admin', 'admin', 'manager'].includes(user.role);

  return (
    <div className="container page-stack">
      <section className="surface-card hero-banner">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Platform configuration</span>
            <h2 className="section-title">Configure system-wide settings for your inventory platform.</h2>
            <p className="page-subtitle">Manage general, security, inventory, and appearance settings from one centralized control panel.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Active settings</span>
              <span className="mini-stat-value">{settings.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Your role</span>
              <span className="mini-stat-value" style={{ fontSize: '1rem', textTransform: 'capitalize' }}>
                {user?.role?.replace(/_/g, ' ') || 'Viewer'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {!isAdmin && (
        <section className="surface-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
          <Lock size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <p className="text-secondary" style={{ margin: 0, fontSize: '13px' }}>
            Settings are read-only for your current role. Contact an administrator to make changes.
          </p>
        </section>
      )}

      {DEFAULT_SETTINGS_GROUPS.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.title} className="surface-card settings-group">
            <div className="settings-group__header">
              <div className="settings-group__icon"><Icon size={20} /></div>
              <div>
                <strong>{group.title}</strong>
                <p className="text-secondary">Configure {group.title.toLowerCase()} parameters.</p>
              </div>
            </div>
            <div className="settings-group__grid">
              {group.keys.map((key) => {
                const currentValue = editingValues[key] !== undefined ? editingValues[key] : (settingsMap[key] || '');
                return (
                  <div key={key} className="setting-row">
                    <div className="setting-row__info">
                      <strong className="setting-key">{key.replace(/_/g, ' ')}</strong>
                      <p className="text-secondary setting-desc">{group.descriptions[key]}</p>
                    </div>
                    <div className="setting-row__control">
                      <input
                        className="control-input"
                        value={currentValue}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        disabled={!isAdmin}
                        placeholder="Not set"
                      />
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="small"
                          icon={<Save size={14} />}
                          loading={saveMut.isPending}
                          onClick={() => handleSave(key)}
                        >
                          Save
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Custom settings section */}
      {(() => {
        const knownKeys = DEFAULT_SETTINGS_GROUPS.flatMap((g) => g.keys);
        const customSettings = settings.filter((s) => !knownKeys.includes(s.key));
        if (customSettings.length === 0 && !isAdmin) return null;

        return (
          <section className="surface-card settings-group">
            <div className="settings-group__header">
              <div className="settings-group__icon"><Settings size={20} /></div>
              <div style={{ flex: 1 }}>
                <strong>Custom Settings</strong>
                <p className="text-secondary">Additional key-value configuration entries.</p>
              </div>
              {isAdmin && (
                <Button variant="ghost" size="small" icon={<Plus size={14} />} onClick={() => setIsAddOpen(true)}>
                  Add setting
                </Button>
              )}
            </div>
            {customSettings.length > 0 && (
              <div className="settings-group__grid">
                {customSettings.map((s) => {
                  const cv = editingValues[s.key] !== undefined ? editingValues[s.key] : s.value;
                  return (
                    <div key={s.key} className="setting-row">
                      <div className="setting-row__info">
                        <strong className="setting-key">{s.key.replace(/_/g, ' ')}</strong>
                      </div>
                      <div className="setting-row__control">
                        <input
                          className="control-input"
                          value={cv}
                          onChange={(e) => handleValueChange(s.key, e.target.value)}
                          disabled={!isAdmin}
                        />
                        {isAdmin && (
                          <Button variant="ghost" size="small" icon={<Save size={14} />} loading={saveMut.isPending} onClick={() => handleSave(s.key)}>
                            Save
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* Add Custom Setting Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add custom setting">
        <form className="page-stack" onSubmit={handleSubmit((data) => createMut.mutate(data))}>
          <div className="form-grid">
            <FormField label="Setting key" error={errors.key?.message}>
              <input className="control-input text-mono" placeholder=" " {...register('key', { required: 'Key is required' })} />
            </FormField>
            <FormField label="Value" error={errors.value?.message}>
              <input className="control-input" placeholder=" " {...register('value', { required: 'Value is required' })} />
            </FormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMut.isPending}>Save setting</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

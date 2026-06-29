import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ClipboardList, Shield } from 'lucide-react';

import Badge from '../components/ui/Badge';
import IMSDataTable from '../components/ui/IMSDataTable';
import { getAuditLogs } from '../services/auditLogs';
import './AuditLogsPage.css';

const ACTION_COLORS = {
  CREATE: 'fulfilled',
  UPDATE: 'processing',
  DELETE: 'cancelled',
  SET: 'pending',
};

function getActionVariant(action) {
  const prefix = action?.split('_')[0]?.toUpperCase();
  return ACTION_COLORS[prefix] || 'pending';
}

export default function AuditLogsPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: getAuditLogs,
  });

  const columns = [
    { key: 'id', label: 'ID', render: (v) => <span className="text-mono">#{v}</span> },
    {
      key: 'action', label: 'Action', isPinned: 'left',
      render: (v) => <Badge variant={getActionVariant(v)}>{v?.replace(/_/g, ' ')}</Badge>,
    },
    { key: 'details', label: 'Details', render: (v) => v || <span className="text-secondary">—</span> },
    { key: 'entity_type', label: 'Entity Type', render: (v) => v || <span className="text-secondary">—</span> },
    {
      key: 'entity_id', label: 'Entity ID',
      render: (v) => v ? <span className="text-mono">#{v}</span> : <span className="text-secondary">—</span>,
    },
    {
      key: 'user_email', label: 'User',
      render: (v) => v || <span className="text-secondary">System</span>,
    },
    {
      key: 'created_at', label: 'Timestamp',
      render: (v) => v ? new Date(v).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }) : '—',
    },
  ];

  return (
    <div className="container page-stack">
      <section className="surface-card hero-banner">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Compliance & governance</span>
            <h2 className="section-title">Comprehensive audit trail for every operation across the platform.</h2>
            <p className="page-subtitle">Track who did what, when, and to which entity. Every create, update, and delete is automatically logged.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Total events</span>
              <span className="mini-stat-value">{logs.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Create events</span>
              <span className="mini-stat-value">{logs.filter((l) => l.action?.startsWith('CREATE')).length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Update events</span>
              <span className="mini-stat-value">{logs.filter((l) => l.action?.startsWith('UPDATE')).length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><ClipboardList size={20} /></div>
          <div>
            <strong>Immutable log</strong>
            <p className="text-secondary">Audit records are append-only and cannot be edited or deleted.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><Activity size={20} /></div>
          <div>
            <strong>Action tracking</strong>
            <p className="text-secondary">Every CRUD operation across all modules is captured with full context.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><Shield size={20} /></div>
          <div>
            <strong>SOC 2 ready</strong>
            <p className="text-secondary">Entity-level audit trails support compliance and forensic investigation.</p>
          </div>
        </div>
      </section>

      <IMSDataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage="No audit logs found. Operations across the platform will appear here automatically."
      />
    </div>
  );
}

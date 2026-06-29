import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowDownToLine, ArrowUpFromLine, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import IMSDataTable from '../components/ui/IMSDataTable';
import { getReturns, createReturn, updateReturn } from '../services/returns';
import { getProducts } from '../services/products';
import './ReturnsPage.css';

function FormField({ label, error, children }) {
  return (
    <div className="form-group">
      {children}
      <span className="floating-label">{label}</span>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

const STATUS_VARIANTS = {
  pending: 'pending',
  approved: 'processing',
  completed: 'fulfilled',
  rejected: 'cancelled',
};

const TYPE_LABELS = {
  customer: { label: 'Customer Return', icon: ArrowDownToLine, variant: 'fulfilled' },
  supplier: { label: 'Supplier Return', icon: ArrowUpFromLine, variant: 'pending' },
};

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: getReturns,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ limit: 500 }),
  });

  const createMut = useMutation({
    mutationFn: createReturn,
    onSuccess: (d) => {
      toast.success(`Return #${d.id} created`);
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddOpen(false);
      reset();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateReturn(id, data),
    onSuccess: (d) => {
      toast.success(`Return #${d.id} updated to ${d.status}`);
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsStatusOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const productMap = useMemo(() => {
    const map = {};
    products.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [products]);

  const columns = [
    { key: 'id', label: 'Return #', render: (v) => <span className="text-mono">#{v}</span> },
    {
      key: 'type', label: 'Type',
      render: (v) => {
        const t = TYPE_LABELS[v] || { label: v, variant: 'pending' };
        return <Badge variant={t.variant}>{t.label}</Badge>;
      },
    },
    {
      key: 'product_id', label: 'Product', isPinned: 'left',
      render: (v) => <strong>{productMap[v] || `Product #${v}`}</strong>,
    },
    { key: 'quantity', label: 'Qty', render: (v) => <span className="text-mono">{v}</span> },
    { key: 'reason', label: 'Reason', render: (v) => v || <span className="text-secondary">—</span> },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={STATUS_VARIANTS[v] || 'pending'}>{v}</Badge>,
    },
    {
      key: 'created_at', label: 'Created',
      render: (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="table-actions">
          <button
            type="button"
            className="action-icon-btn"
            onClick={() => { setSelected(row); setNewStatus(row.status); setIsStatusOpen(true); }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container page-stack">
      <section className="surface-card hero-banner">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Return management</span>
            <h2 className="section-title">Process customer and supplier returns with automated stock adjustments.</h2>
            <p className="page-subtitle">Log return reasons, track approval statuses, and let the system handle stock reconciliation automatically.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Total returns</span>
              <span className="mini-stat-value">{returns.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Customer</span>
              <span className="mini-stat-value">{returns.filter((r) => r.type === 'customer').length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Supplier</span>
              <span className="mini-stat-value">{returns.filter((r) => r.type === 'supplier').length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><ArrowDownToLine size={20} /></div>
          <div>
            <strong>Customer returns</strong>
            <p className="text-secondary">Items returned by customers are added back to inventory on completion.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><ArrowUpFromLine size={20} /></div>
          <div>
            <strong>Supplier returns</strong>
            <p className="text-secondary">Send back defective items — stock is deducted on completion.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><RotateCcw size={20} /></div>
          <div>
            <strong>Approval workflow</strong>
            <p className="text-secondary">Returns flow through pending → approved → completed with audit trail.</p>
          </div>
        </div>
      </section>

      <section className="surface-card toolbar-card">
        <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => { reset(); setIsAddOpen(true); }}>
            Create return
          </Button>
        </div>
      </section>

      <IMSDataTable
        columns={columns}
        data={returns}
        isLoading={isLoading}
        emptyMessage="No returns found. Create a return to start processing refunds or exchanges."
      />

      {/* Create Return */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create return">
        <form className="page-stack" onSubmit={handleSubmit((data) => {
          createMut.mutate({
            type: data.type,
            product_id: parseInt(data.product_id, 10),
            quantity: parseInt(data.quantity, 10),
            reason: data.reason,
            status: 'pending',
          });
        })}>
          <div className="form-grid">
            <FormField label="Return type" error={errors.type?.message}>
              <select className="control-input" {...register('type', { required: 'Required' })}>
                <option value="">Select type...</option>
                <option value="customer">Customer Return</option>
                <option value="supplier">Supplier Return</option>
              </select>
            </FormField>
            <FormField label="Product" error={errors.product_id?.message}>
              <select className="control-input" {...register('product_id', { required: 'Required' })}>
                <option value="">Select product...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </FormField>
            <FormField label="Quantity" error={errors.quantity?.message}>
              <input type="number" min="1" className="control-input" placeholder=" " {...register('quantity', { required: 'Required', min: { value: 1, message: 'Min 1' } })} />
            </FormField>
            <FormField label="Reason" error={errors.reason?.message}>
              <input className="control-input" placeholder=" " {...register('reason', { required: 'Reason is required' })} />
            </FormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMut.isPending}>Create return</Button>
          </div>
        </form>
      </Modal>

      {/* Status Update */}
      <Modal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} title={`Update Return #${selected?.id}`}>
        <div className="page-stack">
          <p className="page-subtitle">Current: <Badge variant={STATUS_VARIANTS[selected?.status]}>{selected?.status}</Badge></p>
          <FormField label="New status">
            <select className="control-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </FormField>
          {newStatus === 'completed' && (
            <div className="surface-card" style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
              <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
                ⚡ Completing will {selected?.type === 'customer' ? 'add items back to' : 'deduct items from'} inventory.
              </p>
            </div>
          )}
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsStatusOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={updateMut.isPending} onClick={() => updateMut.mutate({ id: selected.id, data: { status: newStatus } })}>
              Update status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

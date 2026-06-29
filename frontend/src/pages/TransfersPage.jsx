import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeftRight, CheckCircle, Plus, RefreshCw, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import IMSDataTable from '../components/ui/IMSDataTable';
import { getStockTransfers, createStockTransfer, updateStockTransfer } from '../services/stockTransfers';
import { getWarehouses } from '../services/warehouses';
import { getProducts } from '../services/products';
import './TransfersPage.css';

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
  cancelled: 'cancelled',
};

export default function TransfersPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['stockTransfers'],
    queryFn: getStockTransfers,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ limit: 500 }),
  });

  const createMut = useMutation({
    mutationFn: createStockTransfer,
    onSuccess: (d) => {
      toast.success(`Transfer #${d.id} created`);
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      setIsAddOpen(false);
      reset();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateStockTransfer(id, data),
    onSuccess: (d) => {
      toast.success(`Transfer #${d.id} updated to ${d.status}`);
      queryClient.invalidateQueries({ queryKey: ['stockTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsStatusOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const warehouseMap = useMemo(() => {
    const map = {};
    warehouses.forEach((w) => { map[w.id] = w.name; });
    return map;
  }, [warehouses]);

  const productMap = useMemo(() => {
    const map = {};
    products.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [products]);

  const columns = [
    { key: 'id', label: 'Transfer #', render: (v) => <span className="text-mono">#{v}</span> },
    {
      key: 'source_warehouse_id', label: 'Source', isPinned: 'left',
      render: (v) => <strong>{warehouseMap[v] || `WH #${v}`}</strong>,
    },
    {
      key: 'destination_warehouse_id', label: 'Destination',
      render: (v) => <strong>{warehouseMap[v] || `WH #${v}`}</strong>,
    },
    {
      key: 'product_id', label: 'Product',
      render: (v) => productMap[v] || `Product #${v}`,
    },
    { key: 'quantity', label: 'Qty', render: (v) => <span className="text-mono">{v}</span> },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={STATUS_VARIANTS[v] || 'pending'}>{v?.replace(/_/g, ' ')}</Badge>,
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
            aria-label="Update status"
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
            <span className="eyebrow">Stock movement</span>
            <h2 className="section-title">Transfer inventory between warehouses with automated stock reconciliation.</h2>
            <p className="page-subtitle">Route products between locations, validate source availability, and auto-update utilization on completion.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Total transfers</span>
              <span className="mini-stat-value">{transfers.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">In transit</span>
              <span className="mini-stat-value">{transfers.filter((t) => t.status === 'approved').length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Completed</span>
              <span className="mini-stat-value">{transfers.filter((t) => t.status === 'completed').length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><ArrowLeftRight size={20} /></div>
          <div>
            <strong>Cross-dock transfers</strong>
            <p className="text-secondary">Move stock between any two warehouses in the network with validation.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><Truck size={20} /></div>
          <div>
            <strong>Transit tracking</strong>
            <p className="text-secondary">Monitor transfers through pending → in_transit → completed lifecycle.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><CheckCircle size={20} /></div>
          <div>
            <strong>Auto reconciliation</strong>
            <p className="text-secondary">Completing a transfer automatically adjusts stock at both warehouses.</p>
          </div>
        </div>
      </section>

      <section className="surface-card toolbar-card">
        <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => { reset(); setIsAddOpen(true); }}>
            Create transfer
          </Button>
        </div>
      </section>

      <IMSDataTable
        columns={columns}
        data={transfers}
        isLoading={isLoading}
        emptyMessage="No stock transfers found. Create your first transfer to move inventory between warehouses."
      />

      {/* Create Transfer */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create stock transfer">
        <form className="page-stack" onSubmit={handleSubmit((data) => {
          if (data.source_warehouse_id === data.destination_warehouse_id) {
            toast.error('Source and destination warehouses must be different.');
            return;
          }
          createMut.mutate({
            source_warehouse_id: parseInt(data.source_warehouse_id, 10),
            destination_warehouse_id: parseInt(data.destination_warehouse_id, 10),
            product_id: parseInt(data.product_id, 10),
            quantity: parseInt(data.quantity, 10),
            status: 'pending',
          });
        })}>
          <div className="form-grid">
            <FormField label="Source warehouse" error={errors.source_warehouse_id?.message}>
              <select className="control-input" {...register('source_warehouse_id', { required: 'Required' })}>
                <option value="">Select source...</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </FormField>
            <FormField label="Destination warehouse" error={errors.destination_warehouse_id?.message}>
              <select className="control-input" {...register('destination_warehouse_id', { required: 'Required' })}>
                <option value="">Select destination...</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
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
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMut.isPending}>Create transfer</Button>
          </div>
        </form>
      </Modal>

      {/* Status Update */}
      <Modal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} title={`Update Transfer #${selected?.id}`}>
        <div className="page-stack">
          <p className="page-subtitle">Current: <Badge variant={STATUS_VARIANTS[selected?.status]}>{selected?.status?.replace(/_/g, ' ')}</Badge></p>
          <FormField label="New status">
            <select className="control-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormField>
          {newStatus === 'completed' && (
            <div className="surface-card" style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
              <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
                ⚡ Completing this transfer will deduct stock from the source and add it to the destination warehouse.
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

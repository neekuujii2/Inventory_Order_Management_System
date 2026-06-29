import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { ClipboardList, FileCheck, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import IMSDataTable from '../components/ui/IMSDataTable';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder } from '../services/purchaseOrders';
import { getSuppliers } from '../services/suppliers';
import { getProducts } from '../services/products';
import './PurchaseOrdersPage.css';

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
  draft: 'pending',
  requested: 'processing',
  approved: 'fulfilled',
  received: 'fulfilled',
  invoiced: 'info',
  cancelled: 'cancelled',
};

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: { supplier_id: '', status: 'draft', items: [{ product_id: '', quantity: 1, unit_price: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: getPurchaseOrders,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ limit: 500 }),
  });

  const createMut = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (d) => {
      toast.success(`Purchase order #${d.id} created`);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setIsAddOpen(false);
      reset();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updatePurchaseOrder(id, data),
    onSuccess: (d) => {
      toast.success(`PO #${d.id} status updated to ${d.status}`);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsStatusOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const totalValue = useMemo(() =>
    orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
    [orders]
  );

  const supplierMap = useMemo(() => {
    const map = {};
    suppliers.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [suppliers]);

  const columns = [
    { key: 'id', label: 'PO #', render: (v) => <span className="text-mono">#{v}</span> },
    {
      key: 'supplier_id', label: 'Supplier', isPinned: 'left',
      render: (v) => <strong>{supplierMap[v] || `Supplier #${v}`}</strong>,
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={STATUS_VARIANTS[v] || 'pending'}>{v?.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'total_amount', label: 'Total',
      render: (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(v || 0)),
    },
    {
      key: 'items_count', label: 'Line Items', sortable: false,
      render: (_, row) => <span className="glass-pill">{row.items?.length || 0} items</span>,
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
            <span className="eyebrow">Procurement</span>
            <h2 className="section-title">Manage purchase orders from draft to receiving with full audit trail.</h2>
            <p className="page-subtitle">Create multi-item purchase orders, track status transitions, and auto-increment stock on receipt.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Total POs</span>
              <span className="mini-stat-value">{orders.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Total value</span>
              <span className="mini-stat-value">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalValue)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Pending</span>
              <span className="mini-stat-value">{orders.filter((o) => o.status === 'draft' || o.status === 'submitted').length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><ShoppingCart size={20} /></div>
          <div>
            <strong>Order pipeline</strong>
            <p className="text-secondary">Visualize POs through draft → submitted → approved → received lifecycle.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><FileCheck size={20} /></div>
          <div>
            <strong>Auto stock increment</strong>
            <p className="text-secondary">Product quantities automatically update when PO status transitions to "received".</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><ClipboardList size={20} /></div>
          <div>
            <strong>Multi-line items</strong>
            <p className="text-secondary">Each order supports multiple product line items with individual pricing.</p>
          </div>
        </div>
      </section>

      <section className="surface-card toolbar-card">
        <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => { reset(); setIsAddOpen(true); }}>
            Create purchase order
          </Button>
        </div>
      </section>

      <IMSDataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="No purchase orders found. Create your first PO to start procurement."
      />

      {/* Create PO Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create purchase order">
        <form className="page-stack" onSubmit={handleSubmit((data) => {
          createMut.mutate({
            supplier_id: parseInt(data.supplier_id, 10),
            status: data.status,
            items: data.items.map((i) => ({
              product_id: parseInt(i.product_id, 10),
              quantity: parseInt(i.quantity, 10),
              unit_price: parseFloat(i.unit_price),
            })),
          });
        })}>
          <div className="form-grid">
            <FormField label="Supplier" error={errors.supplier_id?.message}>
              <select className="control-input" {...register('supplier_id', { required: 'Supplier is required' })}>
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Initial status">
              <select className="control-input" {...register('status')}>
                <option value="draft">Draft</option>
                <option value="requested">Requested</option>
              </select>
            </FormField>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <strong>Line Items</strong>
              <Button type="button" variant="ghost" size="small" icon={<Plus size={14} />} onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}>
                Add item
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'start' }}>
                <select className="control-input" {...register(`items.${index}.product_id`, { required: 'Required' })}>
                  <option value="">Product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input type="number" min="1" className="control-input" placeholder="Qty" {...register(`items.${index}.quantity`, { required: true, min: 1 })} />
                <input type="number" step="0.01" min="0" className="control-input" placeholder="Price" {...register(`items.${index}.unit_price`, { required: true, min: 0 })} />
                {fields.length > 1 && (
                  <button type="button" className="action-icon-btn delete" onClick={() => remove(index)} style={{ marginTop: '6px' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMut.isPending}>Create PO</Button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} title={`Update PO #${selected?.id} Status`}>
        <div className="page-stack">
          <p className="page-subtitle">Current status: <Badge variant={STATUS_VARIANTS[selected?.status]}>{selected?.status}</Badge></p>
          <FormField label="New status">
            <select className="control-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="invoiced">Invoiced</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormField>
          {newStatus === 'received' && (
            <div className="surface-card" style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
              <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
                ⚡ Marking as <strong>received</strong> will automatically increment product stock quantities.
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

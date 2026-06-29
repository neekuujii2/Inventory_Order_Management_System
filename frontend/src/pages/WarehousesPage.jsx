import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Boxes, MapPinned, PackageCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import IMSDataTable from '../components/ui/IMSDataTable';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../services/warehouses';
import './WarehousesPage.css';

function FormField({ label, error, children }) {
  return (
    <div className="form-group">
      {children}
      <span className="floating-label">{label}</span>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { register: regAdd, handleSubmit: subAdd, reset: rstAdd, formState: { errors: errAdd } } = useForm();
  const { register: regEdit, handleSubmit: subEdit, reset: rstEdit, formState: { errors: errEdit } } = useForm();

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  const createMut = useMutation({
    mutationFn: createWarehouse,
    onSuccess: (d) => {
      toast.success(`Warehouse "${d.name}" created`);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsAddOpen(false);
      rstAdd();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateWarehouse(id, data),
    onSuccess: (d) => {
      toast.success(`Warehouse "${d.name}" updated`);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsEditOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      toast.success('Warehouse deleted');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsDeleteOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (wh) => {
    setSelected(wh);
    rstEdit({
      name: wh.name,
      code: wh.code,
      location: wh.location || '',
      capacity_sqft: wh.capacity_sqft,
    });
    setIsEditOpen(true);
  };

  const avgUtilization = useMemo(() => {
    if (warehouses.length === 0) return 0;
    return Math.round(warehouses.reduce((s, w) => s + (w.current_utilization_pct || 0), 0) / warehouses.length);
  }, [warehouses]);

  const getUtilBadge = (pct) => {
    if (pct >= 90) return <Badge variant="low-stock">Critical</Badge>;
    if (pct >= 70) return <Badge variant="pending">High</Badge>;
    return <Badge variant="fulfilled">Healthy</Badge>;
  };

  const columns = [
    { key: 'id', label: 'ID', render: (v) => <span className="text-mono">#{v}</span> },
    { key: 'name', label: 'Warehouse', isPinned: 'left', render: (v) => <strong>{v}</strong> },
    { key: 'code', label: 'Code', render: (v) => <span className="text-mono">{v}</span> },
    { key: 'location', label: 'Location', render: (v) => v || <span className="text-secondary">—</span> },
    {
      key: 'capacity_sqft', label: 'Capacity (sqft)', render: (v) =>
        v ? Number(v).toLocaleString() : '—',
    },
    {
      key: 'current_utilization_pct', label: 'Utilization', render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '60px', height: '6px', borderRadius: '3px',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(v || 0, 100)}%`, height: '100%', borderRadius: '3px',
              background: (v || 0) >= 90 ? 'var(--danger)' : (v || 0) >= 70 ? 'var(--warning)' : 'var(--success)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span>{Number(v || 0).toFixed(0)}%</span>
        </div>
      ),
    },
    { key: 'status', label: 'Status', sortable: false, render: (_, row) => getUtilBadge(row.current_utilization_pct || 0) },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="table-actions">
          <button type="button" className="action-icon-btn" onClick={() => openEdit(row)}><Pencil size={16} /></button>
          <button type="button" className="action-icon-btn delete" onClick={() => { setSelected(row); setIsDeleteOpen(true); }}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="container page-stack">
      <section className="surface-card hero-banner">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Warehouse network</span>
            <h2 className="section-title">Orchestrate distributed inventory with capacity perception and transfer visibility.</h2>
            <p className="page-subtitle">Support multi-site fulfillment, stock movement approvals, and warehouse-level utilization with a modern operations view.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Active warehouses</span>
              <span className="mini-stat-value">{warehouses.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Avg utilization</span>
              <span className="mini-stat-value">{avgUtilization}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><MapPinned size={20} /></div>
          <div>
            <strong>Location tracking</strong>
            <p className="text-secondary">Granular movement visibility across zones, racks, and cross-docks.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><Boxes size={20} /></div>
          <div>
            <strong>Transfer approvals</strong>
            <p className="text-secondary">Route transfer requests to stakeholders with audit-friendly controls.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><PackageCheck size={20} /></div>
          <div>
            <strong>Receiving workflow</strong>
            <p className="text-secondary">Operational checks for receiving, put-away, and fulfillment staging.</p>
          </div>
        </div>
      </section>

      <section className="surface-card toolbar-card">
        <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAddOpen(true)}>
            Add warehouse
          </Button>
        </div>
      </section>

      <IMSDataTable
        columns={columns}
        data={warehouses}
        isLoading={isLoading}
        emptyMessage="No warehouses found. Add your first location to start managing distributed inventory."
        bulkActions={[
          { label: 'Delete selected', variant: 'danger', onClick: (rows) => rows.forEach((r) => deleteMut.mutate(r.id)) },
        ]}
      />

      {/* Create */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add warehouse">
        <form className="page-stack" onSubmit={subAdd((data) => createMut.mutate({
          ...data,
          capacity_sqft: parseInt(data.capacity_sqft, 10),
          current_utilization_pct: 0,
        }))}>
          <div className="form-grid">
            <FormField label="Warehouse name" error={errAdd.name?.message}>
              <input className="control-input" placeholder=" " {...regAdd('name', { required: 'Name is required' })} />
            </FormField>
            <FormField label="Code" error={errAdd.code?.message}>
              <input className="control-input text-mono" placeholder=" " {...regAdd('code', { required: 'Code is required' })} />
            </FormField>
            <FormField label="Location">
              <input className="control-input" placeholder=" " {...regAdd('location')} />
            </FormField>
            <FormField label="Capacity (sqft)" error={errAdd.capacity_sqft?.message}>
              <input type="number" min="1" className="control-input" placeholder=" " {...regAdd('capacity_sqft', { required: 'Capacity is required' })} />
            </FormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMut.isPending}>Create warehouse</Button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update warehouse">
        <form className="page-stack" onSubmit={subEdit((data) => updateMut.mutate({
          id: selected.id,
          data: { ...data, capacity_sqft: parseInt(data.capacity_sqft, 10) },
        }))}>
          <div className="form-grid">
            <FormField label="Warehouse name" error={errEdit.name?.message}>
              <input className="control-input" placeholder=" " {...regEdit('name', { required: 'Name is required' })} />
            </FormField>
            <FormField label="Code" error={errEdit.code?.message}>
              <input className="control-input text-mono" placeholder=" " {...regEdit('code', { required: 'Code is required' })} />
            </FormField>
            <FormField label="Location">
              <input className="control-input" placeholder=" " {...regEdit('location')} />
            </FormField>
            <FormField label="Capacity (sqft)" error={errEdit.capacity_sqft?.message}>
              <input type="number" min="1" className="control-input" placeholder=" " {...regEdit('capacity_sqft', { required: 'Capacity is required' })} />
            </FormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={updateMut.isPending}>Save changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete warehouse">
        <div className="page-stack">
          <p className="page-subtitle">
            Delete <strong>{selected?.name}</strong>? All stock data associated with this warehouse will be removed.
          </p>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(selected.id)}>Delete warehouse</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

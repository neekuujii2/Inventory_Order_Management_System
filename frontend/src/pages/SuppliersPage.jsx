import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { BadgeCheck, BriefcaseBusiness, DollarSign, Pencil, Plus, Star, Trash2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import IMSDataTable from '../components/ui/IMSDataTable';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/suppliers';
import './SuppliersPage.css';

function FormField({ label, error, children }) {
  return (
    <div className="form-group">
      {children}
      <span className="floating-label">{label}</span>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { register: regAdd, handleSubmit: subAdd, reset: rstAdd, formState: { errors: errAdd } } = useForm();
  const { register: regEdit, handleSubmit: subEdit, reset: rstEdit, formState: { errors: errEdit } } = useForm();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const createMut = useMutation({
    mutationFn: createSupplier,
    onSuccess: (d) => {
      toast.success(`Supplier "${d.name}" created`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddOpen(false);
      rstAdd();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateSupplier(id, data),
    onSuccess: (d) => {
      toast.success(`Supplier "${d.name}" updated`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsEditOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      toast.success('Supplier deleted');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsDeleteOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (sup) => {
    setSelected(sup);
    rstEdit({
      name: sup.name,
      contact_name: sup.contact_name || '',
      email: sup.email,
      phone: sup.phone,
    });
    setIsEditOpen(true);
  };

  const avgRating = useMemo(() => {
    if (suppliers.length === 0) return 0;
    return (suppliers.reduce((s, v) => s + v.rating, 0) / suppliers.length).toFixed(1);
  }, [suppliers]);

  const totalOutstanding = useMemo(() =>
    suppliers.reduce((s, v) => s + parseFloat(v.outstanding_payments || 0), 0),
    [suppliers]
  );

  const avgOnTime = useMemo(() => {
    if (suppliers.length === 0) return 0;
    return Math.round(suppliers.reduce((s, v) => s + v.delivery_performance, 0) / suppliers.length);
  }, [suppliers]);

  const getHealthBadge = (rating) => {
    if (rating >= 4.5) return <Badge variant="fulfilled">Excellent</Badge>;
    if (rating >= 3.5) return <Badge variant="pending">Strong</Badge>;
    return <Badge variant="low-stock">Needs review</Badge>;
  };

  const columns = [
    { key: 'id', label: 'ID', render: (v) => <span className="text-mono">#{v}</span> },
    { key: 'name', label: 'Supplier', isPinned: 'left', render: (v) => <strong>{v}</strong> },
    { key: 'contact_name', label: 'Contact', render: (v) => v || <span className="text-secondary">—</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'rating', label: 'Rating', render: (v) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={14} style={{ color: 'var(--warning)' }} fill="var(--warning)" />
          {Number(v).toFixed(1)}
        </span>
      ),
    },
    { key: 'delivery_performance', label: 'On-time %', render: (v) => `${Number(v).toFixed(0)}%` },
    {
      key: 'outstanding_payments', label: 'Outstanding', render: (v) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(parseFloat(v || 0)),
    },
    { key: 'health', label: 'Health', sortable: false, render: (_, row) => getHealthBadge(row.rating) },
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
            <span className="eyebrow">Supplier operations</span>
            <h2 className="section-title">Strengthen your supplier network with performance visibility and payment insight.</h2>
            <p className="page-subtitle">Track delivery consistency, outstanding balances, and strategic vendor health in one consolidated control layer.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Total vendors</span>
              <span className="mini-stat-value">{suppliers.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Outstanding payables</span>
              <span className="mini-stat-value">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalOutstanding)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">On-time delivery</span>
              <span className="mini-stat-value">{avgOnTime}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><BriefcaseBusiness size={20} /></div>
          <div>
            <strong>Supplier scorecards</strong>
            <p className="text-secondary">Track reliability, pricing, and service quality by supplier.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><TrendingUp size={20} /></div>
          <div>
            <strong>Spend analysis</strong>
            <p className="text-secondary">Monitor purchase concentration and strategic sourcing opportunities.</p>
          </div>
        </div>
        <div className="surface-card metrics-card">
          <div className="metrics-card__icon"><DollarSign size={20} /></div>
          <div>
            <strong>Payment visibility</strong>
            <p className="text-secondary">View outstanding balances and payment terms without leaving the workspace.</p>
          </div>
        </div>
      </section>

      <section className="surface-card toolbar-card">
        <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAddOpen(true)}>
            Add supplier
          </Button>
        </div>
      </section>

      <IMSDataTable
        columns={columns}
        data={suppliers}
        isLoading={isLoading}
        emptyMessage="No suppliers found. Add your first vendor to build your supply chain."
        bulkActions={[
          { label: 'Delete selected', variant: 'danger', onClick: (rows) => rows.forEach((r) => deleteMut.mutate(r.id)) },
        ]}
      />

      {/* Create Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add supplier">
        <form className="page-stack" onSubmit={subAdd((data) => createMut.mutate(data))}>
          <div className="form-grid">
            <FormField label="Company name" error={errAdd.name?.message}>
              <input className="control-input" placeholder=" " {...regAdd('name', { required: 'Name is required' })} />
            </FormField>
            <FormField label="Contact person" error={errAdd.contact_name?.message}>
              <input className="control-input" placeholder=" " {...regAdd('contact_name')} />
            </FormField>
            <FormField label="Email" error={errAdd.email?.message}>
              <input type="email" className="control-input" placeholder=" " {...regAdd('email', { required: 'Email is required' })} />
            </FormField>
            <FormField label="Phone" error={errAdd.phone?.message}>
              <input className="control-input" placeholder=" " {...regAdd('phone', { required: 'Phone is required' })} />
            </FormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMut.isPending}>Create supplier</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update supplier">
        <form className="page-stack" onSubmit={subEdit((data) => updateMut.mutate({ id: selected.id, data }))}>
          <div className="form-grid">
            <FormField label="Company name" error={errEdit.name?.message}>
              <input className="control-input" placeholder=" " {...regEdit('name', { required: 'Name is required' })} />
            </FormField>
            <FormField label="Contact person">
              <input className="control-input" placeholder=" " {...regEdit('contact_name')} />
            </FormField>
            <FormField label="Email" error={errEdit.email?.message}>
              <input type="email" className="control-input" placeholder=" " {...regEdit('email', { required: 'Email is required' })} />
            </FormField>
            <FormField label="Phone" error={errEdit.phone?.message}>
              <input className="control-input" placeholder=" " {...regEdit('phone', { required: 'Phone is required' })} />
            </FormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={updateMut.isPending}>Save changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete supplier">
        <div className="page-stack">
          <p className="page-subtitle">
            Delete <strong>{selected?.name}</strong>? This will remove the supplier and any associated purchase order links.
          </p>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(selected.id)}>Delete supplier</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

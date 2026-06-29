import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import IMSDataTable from '../components/ui/IMSDataTable';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categories';
import './CategoriesPage.css';

function FormField({ label, error, children }) {
  return (
    <div className="form-group">
      {children}
      <span className="floating-label">{label}</span>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { register: regAdd, handleSubmit: subAdd, reset: rstAdd, formState: { errors: errAdd } } = useForm();
  const { register: regEdit, handleSubmit: subEdit, reset: rstEdit, formState: { errors: errEdit } } = useForm();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: (d) => {
      toast.success(`Category "${d.name}" created`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddOpen(false);
      rstAdd();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: (d) => {
      toast.success(`Category "${d.name}" updated`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDeleteOpen(false);
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (cat) => {
    setSelected(cat);
    rstEdit({ name: cat.name, description: cat.description || '' });
    setIsEditOpen(true);
  };

  const columns = [
    { key: 'id', label: 'ID', render: (v) => <span className="text-mono">#{v}</span> },
    { key: 'name', label: 'Category Name', isPinned: 'left', render: (v) => <strong>{v}</strong> },
    { key: 'description', label: 'Description', render: (v) => v || <span className="text-secondary">—</span> },
    {
      key: 'created_at', label: 'Created', render: (v) =>
        v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="table-actions">
          <button type="button" className="action-icon-btn" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
            <Pencil size={16} />
          </button>
          <button type="button" className="action-icon-btn delete" onClick={() => { setSelected(row); setIsDeleteOpen(true); }} aria-label={`Delete ${row.name}`}>
            <Trash2 size={16} />
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
            <span className="eyebrow">Taxonomy management</span>
            <h2 className="section-title">Organize your catalog with hierarchical product categories.</h2>
            <p className="page-subtitle">Group products by type, function, or department for faster navigation, reporting, and inventory analysis.</p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Total categories</span>
              <span className="mini-stat-value">{categories.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Active groups</span>
              <span className="mini-stat-value">{categories.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card toolbar-card">
        <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAddOpen(true)}>
            Add category
          </Button>
        </div>
      </section>

      <IMSDataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        emptyMessage="No categories found. Create your first category to start organizing products."
        bulkActions={[
          {
            label: 'Delete selected',
            variant: 'danger',
            onClick: (rows) => rows.forEach((r) => deleteMut.mutate(r.id)),
          },
        ]}
      />

      {/* Create Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create category">
        <form className="page-stack" onSubmit={subAdd((data) => createMut.mutate(data))}>
          <div className="form-grid">
            <FormField label="Category name" error={errAdd.name?.message}>
              <input className="control-input" placeholder=" " {...regAdd('name', { required: 'Name is required' })} />
            </FormField>
            <FormField label="Description" error={errAdd.description?.message}>
              <input className="control-input" placeholder=" " {...regAdd('description')} />
            </FormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={createMut.isPending}>Create category</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update category">
        <form className="page-stack" onSubmit={subEdit((data) => updateMut.mutate({ id: selected.id, data }))}>
          <div className="form-grid">
            <FormField label="Category name" error={errEdit.name?.message}>
              <input className="control-input" placeholder=" " {...regEdit('name', { required: 'Name is required' })} />
            </FormField>
            <FormField label="Description">
              <input className="control-input" placeholder=" " {...regEdit('description')} />
            </FormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={updateMut.isPending}>Save changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete category">
        <div className="page-stack">
          <p className="page-subtitle">
            Delete <strong>{selected?.name}</strong>? Products in this category will become uncategorized.
          </p>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(selected.id)}>Delete category</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

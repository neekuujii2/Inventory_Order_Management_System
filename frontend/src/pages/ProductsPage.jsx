import React, { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Filter, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonTable } from '../components/ui/Skeleton';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../services/products';
import './ProductsPage.css';

function ProductFormField({ label, error, children, hint }) {
  return (
    <div className="form-group">
      {children}
      <span className="floating-label">{label}</span>
      {error ? <p className="form-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const {
    register: registerAdd,
    handleSubmit: submitAdd,
    reset: resetAdd,
    formState: { errors: addErrors },
  } = useForm();

  const {
    register: registerEdit,
    handleSubmit: submitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm();

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      toast.success(`Product "${data.name}" created`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsAddOpen(false);
      resetAdd();
    },
    onError: (error) => toast.error(error.message || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (data) => {
      toast.success(`Product "${data.name}" updated`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsEditOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => toast.error(error.message || 'Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => toast.error(error.message || 'Failed to delete product'),
  });

  const filteredProducts = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesTerm =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term);

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && product.quantity < 10) ||
        (stockFilter === 'healthy' && product.quantity >= 10);

      return matchesTerm && matchesStock;
    });
  }, [deferredSearch, products, stockFilter]);

  const inventoryValue = useMemo(
    () =>
      filteredProducts.reduce(
        (sum, product) => sum + parseFloat(product.price ?? 0) * parseInt(product.quantity ?? 0, 10),
        0
      ),
    [filteredProducts]
  );

  const openEditModal = (product) => {
    setSelectedProduct(product);
    resetEdit({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
    });
    setIsEditOpen(true);
  };

  if (isError) {
    return (
      <div className="container page-stack">
        <div className="surface-card error-state">
          <div>
            <h2>Products could not be loaded</h2>
            <p className="page-subtitle">Please verify the API connection and refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="surface-card hero-banner">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Catalog control</span>
            <h2 className="section-title">Manage product records, monitor stock posture, and update core inventory data faster.</h2>
            <p className="page-subtitle">
              Build a clean catalog foundation with searchable SKUs, clear stock indicators, and quick inline actions for replenishment teams.
            </p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Visible products</span>
              <span className="mini-stat-value">{filteredProducts.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Low stock</span>
              <span className="mini-stat-value">{products.filter((item) => item.quantity < 10).length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Inventory value</span>
              <span className="mini-stat-value">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(inventoryValue)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card toolbar-card">
        <div className="toolbar-row">
          <div className="search-shell">
            <Search size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products, SKUs, and identifiers"
              aria-label="Search products"
            />
          </div>
          <button type="button" className="filter-chip" onClick={() => setStockFilter('all')}>
            <Filter size={16} />
            {stockFilter === 'all' ? 'Showing all stock bands' : 'Reset stock filters'}
          </button>
          <button type="button" className={`filter-chip ${stockFilter === 'low' ? 'is-active' : ''}`} onClick={() => setStockFilter('low')}>
            Low stock only
          </button>
          <button
            type="button"
            className={`filter-chip ${stockFilter === 'healthy' ? 'is-active' : ''}`}
            onClick={() => setStockFilter('healthy')}
          >
            Healthy stock only
          </button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAddOpen(true)}>
            Add product
          </Button>
        </div>
      </section>

      {isLoading ? (
        <SkeletonTable rows={7} cols={7} />
      ) : (
        <section className="surface-card table-card">
          <div className="table-meta">
            <div>
              <strong>Inventory register</strong>
              <p className="text-secondary">Sticky headers, quick actions, and stock health status at a glance.</p>
            </div>
            <span className="glass-pill">{filteredProducts.length} rows</span>
          </div>
          <div className="table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit price</th>
                  <th>On hand</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <div>
                          <h3>No products match these filters</h3>
                          <p className="page-subtitle">Try a broader search or clear the current stock filter.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLow = product.quantity < 10;
                    return (
                      <tr key={product.id}>
                        <td className="text-mono">#{product.id}</td>
                        <td>
                          <strong>{product.name}</strong>
                        </td>
                        <td className="text-mono">{product.sku}</td>
                        <td>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(product.price))}
                        </td>
                        <td>{product.quantity}</td>
                        <td>{isLow ? <Badge variant="low-stock">Low stock</Badge> : <Badge variant="fulfilled">Healthy</Badge>}</td>
                        <td>
                          <div className="table-actions">
                            <button type="button" className="action-icon-btn" onClick={() => openEditModal(product)} aria-label={`Edit ${product.name}`}>
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsDeleteOpen(true);
                              }}
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create product">
        <form className="page-stack" onSubmit={submitAdd((data) => createMutation.mutate({
          name: data.name,
          sku: data.sku,
          price: parseFloat(data.price),
          quantity: parseInt(data.quantity, 10),
        }))}>
          <div className="form-grid">
            <ProductFormField label="Product name" error={addErrors.name?.message}>
              <input className="control-input" placeholder=" " {...registerAdd('name', { required: 'Product name is required' })} />
            </ProductFormField>
            <ProductFormField label="SKU" error={addErrors.sku?.message}>
              <input className="control-input text-mono" placeholder=" " {...registerAdd('sku', { required: 'SKU is required' })} />
            </ProductFormField>
            <ProductFormField label="Unit price" error={addErrors.price?.message}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="control-input"
                placeholder=" "
                {...registerAdd('price', {
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be greater than zero' },
                })}
              />
            </ProductFormField>
            <ProductFormField label="Initial quantity" error={addErrors.quantity?.message}>
              <input
                type="number"
                min="0"
                className="control-input"
                placeholder=" "
                {...registerAdd('quantity', {
                  required: 'Quantity is required',
                  min: { value: 0, message: 'Quantity cannot be negative' },
                })}
              />
            </ProductFormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Create product
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update product">
        <form className="page-stack" onSubmit={submitEdit((data) => updateMutation.mutate({
          id: selectedProduct.id,
          data: {
            name: data.name,
            price: parseFloat(data.price),
            quantity: parseInt(data.quantity, 10),
          },
        }))}>
          <div className="form-grid">
            <ProductFormField label="Product name" error={editErrors.name?.message}>
              <input className="control-input" placeholder=" " {...registerEdit('name', { required: 'Product name is required' })} />
            </ProductFormField>
            <ProductFormField label="SKU" hint="Read-only identifier">
              <input className="control-input text-mono" disabled placeholder=" " {...registerEdit('sku')} />
            </ProductFormField>
            <ProductFormField label="Unit price" error={editErrors.price?.message}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="control-input"
                placeholder=" "
                {...registerEdit('price', {
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be greater than zero' },
                })}
              />
            </ProductFormField>
            <ProductFormField label="Quantity" error={editErrors.quantity?.message}>
              <input
                type="number"
                min="0"
                className="control-input"
                placeholder=" "
                {...registerEdit('quantity', {
                  required: 'Quantity is required',
                  min: { value: 0, message: 'Quantity cannot be negative' },
                })}
              />
            </ProductFormField>
          </div>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={updateMutation.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete product">
        <div className="page-stack">
          <p className="page-subtitle">
            Delete <strong>{selectedProduct?.name}</strong>? This will permanently remove the SKU from the catalog.
          </p>
          <div className="toolbar-row products-modal__actions">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedProduct.id)}>
              Delete product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

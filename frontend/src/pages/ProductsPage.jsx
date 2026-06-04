import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/products';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { SkeletonTable } from '../components/ui/Skeleton';
import './ProductsPage.css';

// SVG Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);

  // React Hook Form hooks
  const { register: registerAdd, handleSubmit: handleAddSubmit, reset: resetAddForm, formState: { errors: addErrors } } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEditForm, formState: { errors: editErrors } } = useForm();

  // Fetch products
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      toast.success(`Product "${data.name}" created successfully`);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardStats']);
      setIsAddOpen(false);
      resetAddForm();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (data) => {
      toast.success(`Product "${data.name}" updated successfully`);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardStats']);
      setIsEditOpen(false);
      setSelectedProduct(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardStats']);
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete product');
    },
  });

  // Action triggers
  const onAddSubmit = (data) => {
    createMutation.mutate({
      name: data.name,
      sku: data.sku,
      price: parseFloat(data.price),
      quantity: parseInt(data.quantity, 10),
    });
  };

  const onEditSubmit = (data) => {
    updateMutation.mutate({
      id: selectedProduct.id,
      data: {
        name: data.name,
        price: parseFloat(data.price),
        quantity: parseInt(data.quantity, 10),
      },
    });
  };

  const onDeleteConfirm = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
    resetEditForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
    });
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  // Filter products by search term
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>Manage your inventory levels and catalog</p>
        </div>
        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          Add Product
        </Button>
      </div>

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <SearchIcon />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : isError ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Products</h2>
          <p className="text-secondary">Please check if the backend API server is running.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-secondary" style={{ fontSize: '1rem' }}>No products found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="ims-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isLow = product.quantity < 10;
                return (
                  <tr key={product.id}>
                    <td className="text-mono">#{product.id}</td>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td className="table-sku">{product.sku}</td>
                    <td className="table-price">
                      ${parseFloat(product.price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="table-stock">{product.quantity}</td>
                    <td>
                      {isLow ? (
                        <Badge variant="low-stock">Low Stock</Badge>
                      ) : (
                        <Badge variant="fulfilled">In Stock</Badge>
                      )}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-icon-btn"
                          onClick={() => openEditModal(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="action-icon-btn delete"
                          onClick={() => openDeleteModal(product)}
                          aria-label={`Delete ${product.name}`}
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Product">
        <form onSubmit={handleAddSubmit(onAddSubmit)}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ergonomic Office Chair"
              {...registerAdd('name', { required: 'Name is required' })}
            />
            {addErrors.name && <p className="form-error">{addErrors.name.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">SKU</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CHR-ERG-001"
              {...registerAdd('sku', { required: 'SKU is required' })}
            />
            {addErrors.sku && <p className="form-error">{addErrors.sku.message}</p>}
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="199.99"
                {...registerAdd('price', {
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be positive' }
                })}
              />
              {addErrors.price && <p className="form-error">{addErrors.price.message}</p>}
            </div>
            <div>
              <label className="form-label">Initial Quantity</label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="50"
                {...registerAdd('quantity', {
                  required: 'Quantity is required',
                  min: { value: 0, message: 'Quantity cannot be negative' }
                })}
              />
              {addErrors.quantity && <p className="form-error">{addErrors.quantity.message}</p>}
            </div>
          </div>

          <div className="form-actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Create Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Product">
        <form onSubmit={handleEditSubmit(onEditSubmit)}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-control"
              {...registerEdit('name', { required: 'Name is required' })}
            />
            {editErrors.name && <p className="form-error">{editErrors.name.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">SKU (Read-only)</label>
            <input
              type="text"
              className="form-control"
              disabled
              {...registerEdit('sku')}
            />
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                {...registerEdit('price', {
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be positive' }
                })}
              />
              {editErrors.price && <p className="form-error">{editErrors.price.message}</p>}
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <input
                type="number"
                min="0"
                className="form-control"
                {...registerEdit('quantity', {
                  required: 'Quantity is required',
                  min: { value: 0, message: 'Quantity cannot be negative' }
                })}
              />
              {editErrors.quantity && <p className="form-error">{editErrors.quantity.message}</p>}
            </div>
          </div>

          <div className="form-actions">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Product">
        <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
          Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
        </p>
        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
          <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onDeleteConfirm} loading={deleteMutation.isPending}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

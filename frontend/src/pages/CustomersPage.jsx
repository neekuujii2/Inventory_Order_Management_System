import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getCustomers, createCustomer, deleteCustomer } from '../services/customers';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonTable } from '../components/ui/Skeleton';
import './CustomersPage.css';

// SVG Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch customers
  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      toast.success(`Customer "${data.full_name}" registered successfully`);
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['dashboardStats']);
      setIsAddOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to register customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success('Customer profile deleted successfully');
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['dashboardStats']);
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete customer');
    },
  });

  const onAddSubmit = (data) => {
    createMutation.mutate({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone || null,
    });
  };

  const onDeleteConfirm = () => {
    if (selectedCustomer) {
      deleteMutation.mutate(selectedCustomer.id);
    }
  };

  const openDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  // Filter customers by name or email
  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();
    return (
      customer.full_name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>View client directories and history profiles</p>
        </div>
        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          Register Customer
        </Button>
      </div>

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <SearchIcon />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : isError ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Customers</h2>
          <p className="text-secondary">Please check if the backend API server is running.</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-secondary" style={{ fontSize: '1rem' }}>No customers found.</p>
        </div>
      ) : (
        <div className="table-wrapper customers-table-wrapper">
          <table className="ims-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined Date</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const joinedDate = customer.created_at
                  ? new Date(customer.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A';
                return (
                  <tr key={customer.id}>
                    <td className="text-mono">#{customer.id}</td>
                    <td style={{ fontWeight: 500 }}>{customer.full_name}</td>
                    <td>{customer.email}</td>
                    <td className="text-mono">{customer.phone || '—'}</td>
                    <td>{joinedDate}</td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-icon-btn delete"
                          onClick={() => openDeleteModal(customer)}
                          aria-label={`Delete ${customer.full_name}`}
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

      {/* Add Customer Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Customer">
        <form onSubmit={handleSubmit(onAddSubmit)}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              {...register('fullName', { required: 'Full name is required' })}
            />
            {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. john@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. +1 (555) 123-4567"
              {...register('phone')}
            />
          </div>

          <div className="form-actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Register
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Customer">
        <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
          Are you sure you want to delete the profile for <strong>{selectedCustomer?.full_name}</strong>? This will fail if they have active orders associated with them.
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

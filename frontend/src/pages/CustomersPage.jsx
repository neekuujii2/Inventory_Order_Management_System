import React, { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Mail, Plus, Search, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonTable } from '../components/ui/Skeleton';
import { createCustomer, deleteCustomer, getCustomers } from '../services/customers';
import './CustomersPage.css';

function CustomerField({ label, error, children }) {
  return (
    <div className="form-group">
      {children}
      <span className="floating-label">{label}</span>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      toast.success(`Customer "${data.full_name}" registered`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsAddOpen(false);
      reset();
    },
    onError: (error) => toast.error(error.message || 'Failed to register customer'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success('Customer removed');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error) => toast.error(error.message || 'Failed to delete customer'),
  });

  const filteredCustomers = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return customers.filter((customer) => {
      if (!term) return true;
      return customer.full_name.toLowerCase().includes(term) || customer.email.toLowerCase().includes(term);
    });
  }, [customers, deferredSearch]);

  if (isError) {
    return (
      <div className="container page-stack">
        <div className="surface-card error-state">
          <div>
            <h2>Customer records could not be loaded</h2>
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
            <span className="eyebrow">Customer intelligence</span>
            <h2 className="section-title">Keep customer records clean, searchable, and ready for every sales or service interaction.</h2>
            <p className="page-subtitle">
              Centralize buyer details, preserve contact hygiene, and give operators a faster way to onboard or retire customer profiles.
            </p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Visible accounts</span>
              <span className="mini-stat-value">{filteredCustomers.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Directory size</span>
              <span className="mini-stat-value">{customers.length}</span>
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
              placeholder="Search names and email addresses"
              aria-label="Search customers"
            />
          </div>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsAddOpen(true)}>
            Register customer
          </Button>
        </div>
      </section>

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <section className="surface-card table-card">
          <div className="table-meta">
            <div>
              <strong>Customer directory</strong>
              <p className="text-secondary">Contact details, onboarding dates, and quick profile actions.</p>
            </div>
            <span className="glass-pill">
              <Users size={14} />
              {filteredCustomers.length} profiles
            </span>
          </div>
          <div className="table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div>
                          <h3>No customers match this search</h3>
                          <p className="page-subtitle">Try searching by another email address or customer name.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="text-mono">#{customer.id}</td>
                      <td><strong>{customer.full_name}</strong></td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || 'Not provided'}</td>
                      <td>
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="action-icon-btn delete"
                            aria-label={`Delete ${customer.full_name}`}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register customer">
        <form
          className="page-stack"
          onSubmit={handleSubmit((data) =>
            createMutation.mutate({
              full_name: data.fullName,
              email: data.email,
              phone: data.phone || null,
            })
          )}
        >
          <div className="form-grid">
            <CustomerField label="Full name" error={errors.fullName?.message}>
              <input className="control-input" placeholder=" " {...register('fullName', { required: 'Full name is required' })} />
            </CustomerField>
            <CustomerField label="Email address" error={errors.email?.message}>
              <input
                type="email"
                className="control-input"
                placeholder=" "
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Enter a valid email address',
                  },
                })}
              />
            </CustomerField>
            <CustomerField label="Phone number" error={errors.phone?.message}>
              <input className="control-input" placeholder=" " {...register('phone')} />
            </CustomerField>
            <div className="surface-card customers-page__helper">
              <Mail size={18} />
              <div>
                <strong>Best practice</strong>
                <p className="text-secondary">Store a real team inbox and a service phone number so orders can be resolved quickly.</p>
              </div>
            </div>
          </div>
          <div className="toolbar-row customers-page__actions">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Register customer
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete customer">
        <div className="page-stack">
          <p className="page-subtitle">
            Remove <strong>{selectedCustomer?.full_name}</strong> from the directory? This may fail when active orders still reference the account.
          </p>
          <div className="toolbar-row customers-page__actions">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedCustomer.id)}>
              Delete customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import { createOrder } from '../services/orders';
import { getCustomers } from '../services/customers';
import { getProducts } from '../services/products';
import './CreateOrderPage.css';

function FloatingSelect({ label, value, onChange, options, placeholder = 'Select an option', disabled = false }) {
  return (
    <div className="form-group">
      <select
        className={`control-select ${value ? 'has-value' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="floating-label">{label}</span>
    </div>
  );
}

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState([{ productId: '', quantity: 1 }]);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers({ limit: 100 }),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ limit: 100 }),
  });

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      toast.success(`Order #${data.id} created successfully`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      navigate(`/orders/${data.id}`);
    },
    onError: (error) => toast.error(error.message || 'Failed to create order'),
  });

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const orderSummary = useMemo(() => {
    let total = 0;
    let totalItems = 0;

    lineItems.forEach((item) => {
      if (!item.productId) {
        return;
      }

      const product = productMap.get(parseInt(item.productId, 10));
      if (!product) {
        return;
      }

      total += parseFloat(product.price) * item.quantity;
      totalItems += item.quantity;
    });

    return { total, totalItems };
  }, [lineItems, productMap]);

  const isValid = customerId && lineItems.length > 0 && lineItems.every((item) => item.productId);

  if (customersLoading || productsLoading) {
    return (
      <div className="container page-stack">
        <div className="surface-card empty-state">
          <div className="btn-spinner" style={{ width: '2rem', height: '2rem' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <button type="button" className="glass-pill create-order__back" onClick={() => navigate('/orders')}>
        <ArrowLeft size={14} />
        Back to orders
      </button>

      <section className="surface-card hero-banner">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Order builder</span>
            <h2 className="section-title">Assemble customer orders with stock-aware line items and a live commercial summary.</h2>
            <p className="page-subtitle">
              Pair a customer account with available products, validate quantities before submission, and review totals without leaving the workflow.
            </p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Line items</span>
              <span className="mini-stat-value">{lineItems.length}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Quantity total</span>
              <span className="mini-stat-value">{orderSummary.totalItems}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="create-order__layout">
        <section className="surface-card create-order__editor">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Configuration</span>
              <h3 className="dashboard-section-title">Customer and order lines</h3>
            </div>
          </div>

          <FloatingSelect
            label="Customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            options={customers.map((customer) => ({
              value: customer.id,
              label: `${customer.full_name} (${customer.email})`,
            }))}
            placeholder="Select a customer"
          />

          <div className="create-order__rows">
            {lineItems.map((item, index) => {
              const selectedProduct = item.productId ? productMap.get(parseInt(item.productId, 10)) : null;
              const subtotal = selectedProduct ? parseFloat(selectedProduct.price) * item.quantity : 0;
              const isOutOfStock = selectedProduct && item.quantity > selectedProduct.quantity;

              return (
                <div key={`${item.productId}-${index}`} className="create-order__row surface-card">
                  <FloatingSelect
                    label="Product"
                    value={item.productId}
                    onChange={(event) =>
                      setLineItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, productId: event.target.value } : entry
                        )
                      )
                    }
                    options={products.map((product) => ({
                      value: product.id,
                      label: `${product.name} • ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(product.price))} • Stock ${product.quantity}`,
                    }))}
                    placeholder="Select a product"
                  />

                  <div className="form-group">
                    <input
                      type="number"
                      min="1"
                      className="control-input"
                      value={item.quantity}
                      onChange={(event) =>
                        setLineItems((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, quantity: Math.max(1, parseInt(event.target.value || '1', 10)) } : entry
                          )
                        )
                      }
                      placeholder=" "
                    />
                    <span className="floating-label">Quantity</span>
                  </div>

                  <div className="create-order__subtotal">
                    <span className="text-secondary">Subtotal</span>
                    <strong>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal)}
                    </strong>
                    {isOutOfStock ? <p className="form-error">Requested quantity exceeds available stock.</p> : null}
                  </div>

                  <button
                    type="button"
                    className="action-icon-btn delete"
                    onClick={() =>
                      setLineItems((current) => {
                        const nextItems = current.filter((_, entryIndex) => entryIndex !== index);
                        return nextItems.length ? nextItems : [{ productId: '', quantity: 1 }];
                      })
                    }
                    aria-label="Remove line item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            icon={<Plus size={16} />}
            onClick={() => setLineItems((current) => [...current, { productId: '', quantity: 1 }])}
          >
            Add line item
          </Button>
        </section>

        <aside className="surface-card create-order__summary">
          <span className="eyebrow">Summary</span>
          <h3 className="dashboard-section-title">Order overview</h3>
          <div className="create-order__summary-list">
            <div>
              <span>Customer selected</span>
              <strong>{customers.find((customer) => customer.id === parseInt(customerId, 10))?.full_name || 'None'}</strong>
            </div>
            <div>
              <span>Order lines</span>
              <strong>{lineItems.length}</strong>
            </div>
            <div>
              <span>Total quantity</span>
              <strong>{orderSummary.totalItems}</strong>
            </div>
          </div>
          <div className="create-order__summary-total">
            <span>Grand total</span>
            <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(orderSummary.total)}</strong>
          </div>
          <Button
            variant="primary"
            fullWidth
            loading={createOrderMutation.isPending}
            disabled={!isValid}
            onClick={() =>
              createOrderMutation.mutate({
                customer_id: parseInt(customerId, 10),
                items: lineItems.map((item) => ({
                  product_id: parseInt(item.productId, 10),
                  quantity: item.quantity,
                })),
              })
            }
          >
            Submit order
          </Button>
        </aside>
      </div>
    </div>
  );
}

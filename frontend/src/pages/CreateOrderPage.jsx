import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCustomers } from '../services/customers';
import { getProducts } from '../services/products';
import { createOrder } from '../services/orders';
import Button from '../components/ui/Button';
import './CreateOrderPage.css';

// SVG Icons
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default function CreateOrderPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Selected customer and item rows
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState([{ productId: '', quantity: 1 }]);

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      toast.success(`Order #${data.id} created successfully`);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboardStats']);
      navigate(`/orders/${data.id}`);
    },
    onError: (err) => {
      // Insufficient stock or backend errors. Error details are extracted by interceptor.
      toast.error(err.message || 'Failed to create order. Please check stock levels.');
    },
  });

  // Helper mapping product IDs to details
  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  // Compute values
  const orderSummary = useMemo(() => {
    let total = 0;
    let totalItems = 0;

    lineItems.forEach((item) => {
      if (!item.productId) return;
      const product = productMap.get(parseInt(item.productId, 10));
      if (product) {
        total += parseFloat(product.price) * item.quantity;
        totalItems += item.quantity;
      }
    });

    return { total, totalItems };
  }, [lineItems, productMap]);

  // Add line item row
  const addLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 1 }]);
  };

  // Remove line item row
  const removeLineItem = (index) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated.length > 0 ? updated : [{ productId: '', quantity: 1 }]);
  };

  // Change product in row
  const handleProductChange = (index, prodId) => {
    const updated = [...lineItems];
    updated[index].productId = prodId;
    setLineItems(updated);
  };

  // Change quantity in row
  const handleQuantityChange = (index, qty) => {
    const updated = [...lineItems];
    updated[index].quantity = Math.max(1, parseInt(qty, 10) || 1);
    setLineItems(updated);
  };

  // Check if form is valid to submit
  const isValid = useMemo(() => {
    if (!customerId) return false;
    if (lineItems.length === 0) return false;
    
    // Check if every row has a product selected
    return lineItems.every(item => item.productId !== '');
  }, [customerId, lineItems]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    // Build the exact payload for POST /orders/
    // Schemas define OrderCreate:
    // { customer_id: int, items: list[OrderItemCreate] }
    // OrderItemCreate: { product_id: int, quantity: int }
    const payload = {
      customer_id: parseInt(customerId, 10),
      items: lineItems.map((item) => ({
        product_id: parseInt(item.productId, 10),
        quantity: item.quantity,
      })),
    };

    createOrderMutation.mutate(payload);
  };

  const isLoading = customersLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="btn-spinner" style={{ width: '2rem', height: '2rem' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="detail-back-link" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
        &larr; Back to Orders
      </div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Create New Order</h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>Create custom client purchase invoices and verify stock levels</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="order-form-container">
        {/* Form Body */}
        <div className="order-form-card">
          <h3 className="order-section-title">1. Customer Information</h3>
          <div className="form-group customer-select-wrapper">
            <label className="form-label">Select Customer</label>
            <select
              className="form-control"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">-- Choose a Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <h3 className="order-section-title" style={{ marginTop: '2rem' }}>2. Order Line Items</h3>
          
          <div className="line-items-header">
            <div>Product</div>
            <div>Quantity</div>
            <div>Subtotal</div>
            <div></div>
          </div>

          {lineItems.map((item, index) => {
            const selectedProd = item.productId ? productMap.get(parseInt(item.productId, 10)) : null;
            const subtotal = selectedProd ? parseFloat(selectedProd.price) * item.quantity : 0;
            const isOutOfStock = selectedProd && item.quantity > selectedProd.quantity;

            return (
              <div key={index} className="line-item-row">
                {/* Product Dropdown */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select
                    className="form-control"
                    value={item.productId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${parseFloat(p.price).toFixed(2)}) — Stock: {p.quantity}
                      </option>
                    ))}
                  </select>
                  {isOutOfStock && (
                    <p className="form-error" style={{ fontSize: '0.75rem', position: 'absolute' }}>
                      ⚠️ Insufficient Stock ({selectedProd.quantity} available)
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="number"
                    min="1"
                    className="form-control text-mono"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    required
                  />
                </div>

                {/* Subtotal */}
                <div className="line-item-subtotal">
                  ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  className="action-icon-btn delete"
                  onClick={() => removeLineItem(index)}
                  style={{ height: '42px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Remove item"
                >
                  <TrashIcon />
                </button>
              </div>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={addLineItem}
            style={{ marginTop: '1.5rem', display: 'inline-flex', gap: '0.25rem' }}
          >
            <PlusIcon /> Add Item Row
          </Button>
        </div>

        {/* Summary Card */}
        <div className="order-summary-card">
          <h3 className="order-section-title">Order Summary</h3>
          
          <div className="summary-row">
            <span>Total Unique Items:</span>
            <span className="text-mono" style={{ fontWeight: 600 }}>{lineItems.length}</span>
          </div>
          
          <div className="summary-row">
            <span>Total Quantity Count:</span>
            <span className="text-mono" style={{ fontWeight: 600 }}>{orderSummary.totalItems}</span>
          </div>

          {customerId && (
            <div className="summary-row" style={{ borderTop: '1px solid rgba(71, 85, 105, 0.2)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
              <span>Customer selected:</span>
              <span style={{ fontWeight: 500 }}>
                {customers.find((c) => c.id === parseInt(customerId, 10))?.full_name}
              </span>
            </div>
          )}

          <div className="summary-row total">
            <span>Grand Total:</span>
            <span className="summary-value-total">
              ${orderSummary.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!isValid}
            loading={createOrderMutation.isPending}
            style={{ marginTop: '1.5rem' }}
          >
            Submit Order Request
          </Button>
        </div>
      </form>
    </div>
  );
}

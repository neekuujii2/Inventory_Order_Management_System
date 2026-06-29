import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getOrder, updateOrderStatus } from '../services/orders';
import './OrderDetailPage.css';

export default function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateOrderStatus(id, status),
    onSuccess: (data) => {
      toast.success(`Order #${data.id} marked ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error) => toast.error(error.message || 'Failed to update order'),
  });

  if (isLoading) {
    return (
      <div className="container page-stack">
        <div className="surface-card empty-state">
          <div className="btn-spinner" style={{ width: '2rem', height: '2rem' }} />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container page-stack">
        <Link to="/orders" className="glass-pill order-detail__back">
          <ArrowLeft size={14} />
          Back to orders
        </Link>
        <div className="surface-card error-state">
          <div>
            <h2>Order not found</h2>
            <p className="page-subtitle">The requested order could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  return (
    <div className="container page-stack">
      <Link to="/orders" className="glass-pill order-detail__back">
        <ArrowLeft size={14} />
        Back to orders
      </Link>

      <section className="surface-card hero-banner">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Order detail</span>
            <div className="order-detail__title-row">
              <h2 className="section-title">Order #{order.id}</h2>
              <Badge variant={order.status}>{order.status}</Badge>
            </div>
            <p className="page-subtitle">Placed on {orderDate} by {order.customer_name}.</p>
          </div>
          {order.status === 'pending' ? (
            <div className="hero-actions order-detail__hero-actions">
              <Button variant="ghost" icon={<XCircle size={16} />} onClick={() => statusMutation.mutate('cancelled')}>
                Cancel order
              </Button>
              <Button variant="primary" icon={<CheckCircle2 size={16} />} onClick={() => statusMutation.mutate('fulfilled')}>
                Fulfill order
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <div className="order-detail__layout">
        <aside className="surface-card order-detail__sidebar">
          <span className="eyebrow">Client and billing</span>
          <div className="order-detail__info-list">
            <div>
              <span>Customer</span>
              <strong>{order.customer_name}</strong>
            </div>
            <div>
              <span>Customer ID</span>
              <strong className="text-mono">#{order.customer_id}</strong>
            </div>
            <div>
              <span>Total amount</span>
              <strong>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(order.total_amount))}
              </strong>
            </div>
          </div>
        </aside>

        <section className="surface-card table-card">
          <div className="table-meta">
            <div>
              <strong>Order line items</strong>
              <p className="text-secondary">Granular item pricing, quantities, and per-line subtotals.</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={`${item.product_id}-${item.product_name}`}>
                    <td>
                      <strong>{item.product_name}</strong>
                      <div className="text-secondary text-mono">#{item.product_id}</div>
                    </td>
                    <td>{item.quantity}</td>
                    <td>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(item.unit_price))}
                    </td>
                    <td>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(item.unit_price) * item.quantity)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td><strong>Total</strong></td>
                  <td />
                  <td />
                  <td>
                    <strong>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(order.total_amount))}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

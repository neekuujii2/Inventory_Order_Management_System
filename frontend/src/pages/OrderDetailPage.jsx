import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrder, updateOrderStatus } from '../services/orders';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import './OrderDetailPage.css';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch single order details
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: () => updateOrderStatus(id, 'cancelled'),
    onSuccess: (data) => {
      toast.success(`Order #${data.id} cancelled successfully`);
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['dashboardStats']);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to cancel order');
    },
  });

  // Fulfill order mutation (bonus premium feature!)
  const fulfillOrderMutation = useMutation({
    mutationFn: () => updateOrderStatus(id, 'fulfilled'),
    onSuccess: (data) => {
      toast.success(`Order #${data.id} fulfilled successfully`);
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['dashboardStats']);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to fulfill order');
    },
  });

  if (isLoading) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="btn-spinner" style={{ width: '2rem', height: '2rem' }}></div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container">
        <Link to="/orders" className="detail-back-link">
          &larr; Back to Orders
        </Link>
        <div style={{ padding: '2rem', marginTop: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Order Not Found</h2>
          <p className="text-secondary">The requested order #{id} does not exist or could not be loaded.</p>
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
        timeZoneName: 'short',
      })
    : 'N/A';

  const isPending = order.status === 'pending';

  return (
    <div className="container">
      <Link to="/orders" className="detail-back-link">
        &larr; Back to Orders
      </Link>

      <div className="detail-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title" style={{ fontFamily: 'var(--font-mono)' }}>Order #{order.id}</h1>
            <Badge variant={order.status}>{order.status}</Badge>
          </div>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>Placed on {orderDate}</p>
        </div>
        
        {isPending && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="ghost"
              onClick={() => cancelOrderMutation.mutate()}
              loading={cancelOrderMutation.isPending}
            >
              Cancel Order
            </Button>
            <Button
              variant="primary"
              onClick={() => fulfillOrderMutation.mutate()}
              loading={fulfillOrderMutation.isPending}
            >
              Fulfill Order
            </Button>
          </div>
        )}
      </div>

      <div className="detail-grid">
        {/* Customer Sidebar Info */}
        <div className="info-card">
          <h3 className="info-title">Client Details</h3>
          <div className="info-group">
            <div className="info-label">Customer Name</div>
            <div className="info-value">{order.customer_name}</div>
          </div>
          <div className="info-group">
            <div className="info-label">Customer ID</div>
            <div className="info-value mono">#{order.customer_id}</div>
          </div>
          <div className="info-group" style={{ borderTop: '1px solid rgba(71, 85, 105, 0.2)', paddingTop: '1rem', marginTop: '1rem' }}>
            <div className="info-label">Payment Summary</div>
            <div className="info-label" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Total Amount Charged</div>
            <div className="info-value price">
              ${parseFloat(order.total_amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="table-wrapper">
          <table className="ims-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                    <div className="text-secondary" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      ID: #{item.product_id}
                    </div>
                  </td>
                  <td className="text-mono">{item.quantity}</td>
                  <td className="text-mono">
                    ${parseFloat(item.unit_price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="text-mono table-price" style={{ textAlign: 'right' }}>
                    ${(parseFloat(item.unit_price) * item.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="2" style={{ fontWeight: 700 }}>Total</td>
                <td></td>
                <td className="text-mono table-price" style={{ textAlign: 'right', fontWeight: 700 }}>
                  ${parseFloat(order.total_amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

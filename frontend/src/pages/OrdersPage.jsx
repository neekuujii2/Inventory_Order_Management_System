import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Clock3, Filter, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonTable } from '../components/ui/Skeleton';
import { deleteOrder, getOrders } from '../services/orders';
import './OrdersPage.css';

const tabs = [
  { id: 'all', label: 'All orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'fulfilled', label: 'Fulfilled' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      toast.success('Order deleted');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSelectedOrder(null);
      setIsDeleteOpen(false);
    },
    onError: (error) => toast.error(error.message || 'Failed to delete order'),
  });

  const filteredOrders = useMemo(
    () => orders.filter((order) => activeTab === 'all' || order.status === activeTab),
    [activeTab, orders]
  );

  const pendingCount = orders.filter((order) => order.status === 'pending').length;

  if (isError) {
    return (
      <div className="container page-stack">
        <div className="surface-card error-state">
          <div>
            <h2>Orders could not be loaded</h2>
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
            <span className="eyebrow">Fulfillment operations</span>
            <h2 className="section-title">Track order execution from intake to completion with clearer queue management.</h2>
            <p className="page-subtitle">
              Review recent transactions, keep the status board clean, and jump into individual order records with one click.
            </p>
          </div>
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Active queue</span>
              <span className="mini-stat-value">{pendingCount}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Visible orders</span>
              <span className="mini-stat-value">{filteredOrders.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card toolbar-card">
        <div className="toolbar-row orders-toolbar">
          <div className="orders-tab-row">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-chip ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Filter size={16} />
                {tab.label}
              </button>
            ))}
          </div>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate('/orders/new')}>
            New order
          </Button>
        </div>
      </section>

      {isLoading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : (
        <section className="surface-card table-card">
          <div className="table-meta">
            <div>
              <strong>Order ledger</strong>
              <p className="text-secondary">Sortable fulfillment queue with quick status visibility and drill-down navigation.</p>
            </div>
            <span className="glass-pill">
              <ShoppingCart size={14} />
              {filteredOrders.length} orders
            </span>
          </div>
          <div className="table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <div>
                          <h3>No orders in this lane</h3>
                          <p className="page-subtitle">Switch the status filter or create a new order to populate the queue.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <tr key={order.id} className="orders-page__row" onClick={() => navigate(`/orders/${order.id}`)}>
                        <td className="text-mono">#{order.id}</td>
                        <td><strong>{order.customer_name}</strong></td>
                        <td>{totalItems}</td>
                        <td>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(order.total_amount))}
                        </td>
                        <td><Badge variant={order.status}>{order.status}</Badge></td>
                        <td>
                          <span className="glass-pill">
                            <Clock3 size={14} />
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              aria-label={`Delete order ${order.id}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedOrder(order);
                                setIsDeleteOpen(true);
                              }}
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

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete order">
        <div className="page-stack">
          <p className="page-subtitle">
            Delete order <strong>#{selectedOrder?.id}</strong> for <strong>{selectedOrder?.customer_name}</strong>? This removes the record from the active order ledger.
          </p>
          <div className="toolbar-row orders-page__actions">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedOrder.id)}>
              Delete order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

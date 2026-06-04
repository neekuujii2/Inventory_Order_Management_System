import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrders, deleteOrder } from '../services/orders';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { SkeletonTable } from '../components/ui/Skeleton';
import './OrdersPage.css';

// SVG Icons
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      toast.success('Order cancelled and deleted successfully');
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['dashboardStats']);
      setIsDeleteOpen(false);
      setSelectedOrder(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete order');
    },
  });

  const handleDeleteClick = (e, order) => {
    e.stopPropagation(); // Avoid triggering row navigation
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const onDeleteConfirm = () => {
    if (selectedOrder) {
      deleteMutation.mutate(selectedOrder.id);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/orders/${id}`);
  };

  // Filter orders by active tab status
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  // Tabs structure
  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'fulfilled', label: 'Fulfilled' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>Track and manage client invoices and fulfillment status</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/orders/new')}>
          New Order
        </Button>
      </div>

      {/* Tabs */}
      <div className="filter-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : isError ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Orders</h2>
          <p className="text-secondary">Please check if the backend API server is running.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-secondary" style={{ fontSize: '1rem' }}>No orders found in this category.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="ims-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const orderDate = order.created_at
                  ? new Date(order.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A';
                
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <tr
                    key={order.id}
                    className="clickable-row"
                    onClick={() => handleRowClick(order.id)}
                  >
                    <td className="text-mono">#{order.id}</td>
                    <td style={{ fontWeight: 500 }}>{order.customer_name}</td>
                    <td>{totalItems}</td>
                    <td className="table-price">
                      ${parseFloat(order.total_amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <Badge variant={order.status}>{order.status}</Badge>
                    </td>
                    <td>{orderDate}</td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-icon-btn delete"
                          onClick={(e) => handleDeleteClick(e, order)}
                          aria-label={`Cancel and delete order #${order.id}`}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Cancel & Delete Order">
        <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
          Are you sure you want to delete and cancel order <strong>#{selectedOrder?.id}</strong> for <strong>{selectedOrder?.customer_name}</strong>?
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          *Note: Per the current business specs, deleted order records do not restore product stock level counts.
        </p>
        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
          <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onDeleteConfirm} loading={deleteMutation.isPending}>
            Delete Order
          </Button>
        </div>
      </Modal>
    </div>
  );
}

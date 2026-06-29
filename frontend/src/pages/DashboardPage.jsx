import React, { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react';

import KanbanBoard from '../components/dashboard/KanbanBoard';
import MetricCard from '../components/dashboard/MetricCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import { SkeletonCards, SkeletonChart, SkeletonTable } from '../components/ui/Skeleton';
import { getStats } from '../services/dashboard';
import { getOrders, updateOrderStatus } from '../services/orders';
import './DashboardPage.css';

const currency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value ?? 0);

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getStats,
  });

  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders({ limit: 100 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: (data) => {
      toast.success(`Order #${data.id} moved to ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });

  const metrics = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.status === 'pending').length;
    const fulfilledOrders = orders.filter((order) => order.status === 'fulfilled').length;
    const revenue = orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + parseFloat(order.total_amount ?? 0), 0);

    return {
      pendingOrders,
      fulfilledOrders,
      revenue,
      lowStockCount: stats?.low_stock?.length ?? 0,
    };
  }, [orders, stats]);

  if (statsError || ordersError) {
    return (
      <div className="container page-stack">
        <div className="surface-card error-state">
          <div>
            <h2>Unable to load the operations dashboard</h2>
            <p className="page-subtitle">Check the backend API and refresh the workspace.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-stack dashboard-page">
      <section className="surface-card hero-banner">
        <div className="hero-grid">
          <div className="dashboard-hero__copy">
            <span className="eyebrow">Executive overview</span>
            <h2 className="section-title">Operational visibility across stock, orders, revenue, and exception handling.</h2>
            <p className="page-subtitle">
              Keep fulfillment moving with real-time summaries, low-stock awareness, and a drag-and-drop order pipeline designed for fast daily operations.
            </p>
            <div className="hero-actions">
              <span className="glass-pill">
                <Sparkles size={14} />
                Live performance pulse
              </span>
              <span className="glass-pill">
                <Boxes size={14} />
                Warehouse-ready workflow
              </span>
            </div>
          </div>

          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span className="text-secondary">Revenue tracked</span>
              <span className="mini-stat-value">{currency(metrics.revenue)}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Pending orders</span>
              <span className="mini-stat-value">{metrics.pendingOrders}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Low stock alerts</span>
              <span className="mini-stat-value">{metrics.lowStockCount}</span>
            </div>
            <div className="mini-stat">
              <span className="text-secondary">Fulfilled orders</span>
              <span className="mini-stat-value">{metrics.fulfilledOrders}</span>
            </div>
          </div>
        </div>
      </section>

      {statsLoading || ordersLoading ? (
        <>
          <SkeletonCards />
          <SkeletonChart />
          <SkeletonTable rows={4} cols={4} />
        </>
      ) : (
        <>
          <section className="dashboard-grid">
            <MetricCard
              label="Products under management"
              value={stats.total_products}
              subtext="SKUs currently available in inventory."
              icon={<Package size={24} />}
              type="info"
              trend="Updated live"
            />
            <MetricCard
              label="Customer accounts"
              value={stats.total_customers}
              subtext="Registered buyers and active company contacts."
              icon={<Users size={24} />}
              type="success"
              trend="CRM synced"
            />
            <MetricCard
              label="Orders processed"
              value={stats.total_orders}
              subtext="Open and completed sales orders across channels."
              icon={<ShoppingCart size={24} />}
              type="info"
              trend={`${metrics.pendingOrders} pending`}
            />
            <MetricCard
              label="Low-stock attention"
              value={stats.low_stock.length}
              subtext="Items below the threshold and at risk of delay."
              icon={<AlertTriangle size={24} />}
              type={stats.low_stock.length > 0 ? 'warning' : 'success'}
              trend={stats.low_stock.length > 0 ? 'Action needed' : 'Healthy'}
            />
          </section>

          <section className="dashboard-panels">
            <RevenueChart orders={orders} />
            <div className="surface-card dashboard-alerts">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Attention center</span>
                  <h3 className="dashboard-section-title">Inventory alerts</h3>
                </div>
                <span className="glass-pill">
                  <DollarSign size={14} />
                  {currency(stats.recent_revenue)}
                </span>
              </div>

              <div className="dashboard-alerts__list">
                {stats.low_stock.length === 0 ? (
                  <div className="empty-state">
                    <div>
                      <h4>All inventory bands look healthy</h4>
                      <p className="page-subtitle">No urgent replenishment items are showing up right now.</p>
                    </div>
                  </div>
                ) : (
                  stats.low_stock.map((item) => (
                    <motion.div
                      key={item.id}
                      className="dashboard-alerts__item"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <p className="text-secondary text-mono">{item.sku}</p>
                      </div>
                      <div className="dashboard-alerts__meta">
                        <span>{item.quantity} left</span>
                        <strong>{currency(item.price)}</strong>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="surface-card dashboard-pipeline">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Execution flow</span>
                <h3 className="dashboard-section-title">Order pipeline</h3>
                <p className="page-subtitle">Drag cards between columns to update status and keep the team aligned.</p>
              </div>
            </div>
            <KanbanBoard
              orders={orders}
              onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
            />
          </section>
        </>
      )}
    </div>
  );
}

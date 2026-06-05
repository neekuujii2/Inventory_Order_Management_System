import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '../services/dashboard';
import { getOrders } from '../services/orders';
import { getProducts } from '../services/products';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Truck
} from 'lucide-react';
import './ReportsPage.css';

/* ── Utility helpers ── */
const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtNum = (n) => new Intl.NumberFormat('en-US').format(n ?? 0);

const STATUS_META = {
  pending:    { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <Clock size={14} /> },
  processing: { label: 'Processing', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: <Truck size={14} /> },
  shipped:    { label: 'Shipped',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  icon: <Truck size={14} /> },
  delivered:  { label: 'Delivered',  color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={14} /> },
  cancelled:  { label: 'Cancelled',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: <XCircle size={14} /> },
};

/* ── Summary Metric Card ── */
function SummaryCard({ label, value, subtext, icon, trend, trendUp }) {
  return (
    <div className="rp-metric-card">
      <div className="rp-metric-header">
        <div className="rp-metric-icon-wrap">{icon}</div>
        {trend != null && (
          <span className={`rp-metric-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend}
          </span>
        )}
      </div>
      <div className="rp-metric-value">{value}</div>
      <div className="rp-metric-label">{label}</div>
      {subtext && <div className="rp-metric-sub">{subtext}</div>}
    </div>
  );
}

/* ── Status Badge ── */
function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? { label: status, color: '#64748b', bg: '#f1f5f9', icon: null };
  return (
    <span
      className="rp-status-badge"
      style={{ color: m.color, background: m.bg, borderColor: m.color + '33' }}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

/* ── Inline Bar Chart for status distribution ── */
function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rp-status-row">
      <div className="rp-status-row-label">
        <span className="rp-status-dot" style={{ background: color }} />
        {label}
      </div>
      <div className="rp-status-row-bar">
        <div
          className="rp-status-row-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="rp-status-row-count">{count}</span>
      <span className="rp-status-row-pct">{pct}%</span>
    </div>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('all');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getStats,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const isLoading = statsLoading || ordersLoading || productsLoading;

  /* ── Derived metrics from real data ── */
  const metrics = useMemo(() => {
    if (!orders.length && !products.length) return null;

    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + parseFloat(o.total_amount ?? 0), 0);

    const inventoryValue = products.reduce(
      (sum, p) => sum + parseFloat(p.price ?? 0) * parseInt(p.quantity ?? 0),
      0
    );

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const topProducts = [...products]
      .sort((a, b) => parseInt(b.quantity ?? 0) - parseInt(a.quantity ?? 0))
      .slice(0, 8);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))
      .slice(0, 10);

    const lowStock = products.filter((p) => parseInt(p.quantity ?? 0) < 10);

    return {
      totalRevenue,
      inventoryValue,
      statusCounts,
      avgOrderValue,
      topProducts,
      recentOrders,
      lowStock,
      totalOrders: orders.length,
    };
  }, [orders, products]);

  /* ── Export CSV ── */
  const handleExport = () => {
    if (!orders.length) return;
    const headers = ['ID', 'Customer', 'Status', 'Total', 'Date'];
    const rows = orders.map((o) => [
      o.id,
      o.customer_name ?? o.customer?.name ?? '—',
      o.status,
      o.total_amount ?? 0,
      o.created_at ? new Date(o.created_at).toLocaleDateString() : '—',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ims-orders-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container rp-page">
        <div className="rp-skeleton-header" />
        <div className="rp-skeleton-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="rp-skeleton-card" />)}
        </div>
        <div className="rp-skeleton-body" />
      </div>
    );
  }

  return (
    <div className="container rp-page">
      {/* ─── PAGE HEADER ─── */}
      <div className="rp-header">
        <div>
          <h1 className="rp-title">Reports &amp; Insights</h1>
          <p className="rp-subtitle">
            Business overview · inventory health · order performance
          </p>
        </div>
        <div className="rp-header-actions">
          <div className="rp-date-tabs">
            {['all', '7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                className={`rp-date-tab${dateRange === r ? ' active' : ''}`}
                onClick={() => setDateRange(r)}
              >
                {r === 'all' ? 'All Time' : `Last ${r}`}
              </button>
            ))}
          </div>
          <button className="rp-export-btn" onClick={handleExport}>
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ─── SUMMARY METRIC CARDS ─── */}
      <div className="rp-metrics-grid">
        <SummaryCard
          label="Total Revenue"
          value={fmt(metrics?.totalRevenue)}
          subtext="From non-cancelled orders"
          icon={<DollarSign size={18} />}
          trend="+12.4%"
          trendUp
        />
        <SummaryCard
          label="Total Orders"
          value={fmtNum(metrics?.totalOrders)}
          subtext="All order records"
          icon={<ShoppingCart size={18} />}
          trend="+8.1%"
          trendUp
        />
        <SummaryCard
          label="Inventory Value"
          value={fmt(metrics?.inventoryValue)}
          subtext="Stock × unit price"
          icon={<Package size={18} />}
        />
        <SummaryCard
          label="Avg. Order Value"
          value={fmt(metrics?.avgOrderValue)}
          subtext="Revenue per order"
          icon={<TrendingUp size={18} />}
          trend="+3.7%"
          trendUp
        />
      </div>

      {/* ─── MAIN CONTENT GRID ─── */}
      <div className="rp-content-grid">

        {/* LEFT COL: Order Status Distribution */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h2 className="rp-card-title">Order Status Distribution</h2>
            <span className="rp-card-badge">{metrics?.totalOrders} total</span>
          </div>
          <div className="rp-status-list">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <StatusBar
                key={key}
                label={meta.label}
                count={metrics?.statusCounts?.[key] ?? 0}
                total={metrics?.totalOrders ?? 0}
                color={meta.color}
              />
            ))}
          </div>

          {/* Quick status pills */}
          <div className="rp-status-pills">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <div
                key={key}
                className="rp-status-pill"
                style={{ borderColor: meta.color + '40', background: meta.bg }}
              >
                <span className="rp-status-pill-num" style={{ color: meta.color }}>
                  {metrics?.statusCounts?.[key] ?? 0}
                </span>
                <span className="rp-status-pill-label">{meta.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COL: Low Stock Alert */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h2 className="rp-card-title">
              <AlertTriangle size={16} style={{ color: '#f59e0b', marginRight: 6 }} />
              Low Stock Alert
            </h2>
            <span
              className="rp-card-badge"
              style={
                (metrics?.lowStock?.length ?? 0) > 0
                  ? { background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }
                  : {}
              }
            >
              {metrics?.lowStock?.length ?? 0} items
            </span>
          </div>

          {metrics?.lowStock?.length === 0 ? (
            <div className="rp-empty-state">
              <CheckCircle2 size={32} style={{ color: '#10b981', marginBottom: 8 }} />
              <p>All products are well-stocked</p>
            </div>
          ) : (
            <div className="rp-low-stock-list">
              {metrics?.lowStock?.map((p) => (
                <div key={p.id} className="rp-low-stock-row">
                  <div className="rp-low-stock-info">
                    <span className="rp-low-stock-name">{p.name}</span>
                    <span className="rp-low-stock-sku">SKU: {p.sku ?? `#${p.id}`}</span>
                  </div>
                  <div className="rp-low-stock-qty">
                    <span
                      className="rp-qty-badge"
                      style={
                        parseInt(p.quantity) === 0
                          ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                          : { background: 'rgba(245,158,11,0.1)', color: '#d97706' }
                      }
                    >
                      {p.quantity} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── TOP PRODUCTS TABLE ─── */}
      <div className="rp-card rp-full-width">
        <div className="rp-card-header">
          <div>
            <h2 className="rp-card-title">Top Products by Stock</h2>
            <p className="rp-card-desc">Highest quantity products in inventory</p>
          </div>
          <span className="rp-card-badge">{products.length} products total</span>
        </div>
        <div className="rp-table-wrapper">
          <table className="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Stock Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.topProducts ?? []).map((p, idx) => {
                const qty = parseInt(p.quantity ?? 0);
                const stockVal = parseFloat(p.price ?? 0) * qty;
                const stockStatus =
                  qty === 0 ? 'out' : qty < 10 ? 'low' : qty < 30 ? 'medium' : 'good';
                return (
                  <tr key={p.id}>
                    <td className="rp-table-rank">{idx + 1}</td>
                    <td>
                      <span className="rp-table-product-name">{p.name}</span>
                    </td>
                    <td className="rp-table-mono">{p.sku ?? `SKU-${p.id}`}</td>
                    <td>{p.category ?? '—'}</td>
                    <td className="rp-table-mono">{fmt(p.price)}</td>
                    <td>
                      <span className="rp-table-stock">{fmtNum(qty)}</span>
                    </td>
                    <td className="rp-table-mono">{fmt(stockVal)}</td>
                    <td>
                      <span className={`rp-stock-status ${stockStatus}`}>
                        {stockStatus === 'out'
                          ? 'Out of Stock'
                          : stockStatus === 'low'
                          ? 'Low Stock'
                          : stockStatus === 'medium'
                          ? 'Moderate'
                          : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── RECENT ORDERS ─── */}
      <div className="rp-card rp-full-width">
        <div className="rp-card-header">
          <div>
            <h2 className="rp-card-title">Recent Orders</h2>
            <p className="rp-card-desc">Latest {Math.min(10, orders.length)} orders from the system</p>
          </div>
          <span className="rp-card-badge">
            <Calendar size={12} style={{ marginRight: 4 }} />
            Latest 10
          </span>
        </div>
        <div className="rp-table-wrapper">
          <table className="rp-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.recentOrders ?? []).map((o) => (
                <tr key={o.id}>
                  <td className="rp-table-mono rp-table-id">#{o.id}</td>
                  <td>
                    <span className="rp-table-customer">
                      {o.customer_name ?? o.customer?.name ?? '—'}
                    </span>
                  </td>
                  <td>{o.items?.length ?? o.order_items?.length ?? '—'}</td>
                  <td className="rp-table-mono rp-table-amount">{fmt(o.total_amount)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="rp-table-date">
                    {o.created_at
                      ? new Date(o.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

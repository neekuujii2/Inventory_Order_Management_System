import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '../services/dashboard';
import { getOrders } from '../services/orders';
import { getProducts } from '../services/products';
import { getCustomers } from '../services/customers';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import './AnalyticsPage.css';

/* ── Formatters ── */
const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
const fmtNum = (n) => new Intl.NumberFormat('en-US').format(n ?? 0);

/* ── Month names ── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ── Status colors ── */
const STATUS_COLORS = {
  pending:    '#f59e0b',
  processing: '#3b82f6',
  shipped:    '#8b5cf6',
  delivered:  '#10b981',
  cancelled:  '#ef4444',
};

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon, trend, trendDir, color }) {
  return (
    <div className="ap-kpi-card" style={{ '--kpi-accent': color }}>
      <div className="ap-kpi-top">
        <div className="ap-kpi-icon" style={{ background: `${color}14`, color }}>
          {icon}
        </div>
        <div className={`ap-kpi-trend ${trendDir}`}>
          {trendDir === 'up'   && <ArrowUpRight size={13} />}
          {trendDir === 'down' && <ArrowDownRight size={13} />}
          {trendDir === 'flat' && <Minus size={13} />}
          {trend}
        </div>
      </div>
      <div className="ap-kpi-value">{value}</div>
      <div className="ap-kpi-label">{label}</div>
      {sub && <div className="ap-kpi-sub">{sub}</div>}
    </div>
  );
}

/* ── Inline Bar (horizontal) ── */
function HorizontalBar({ label, value, max, color, formatted }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="ap-hbar-row">
      <span className="ap-hbar-label">{label}</span>
      <div className="ap-hbar-track">
        <div
          className="ap-hbar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="ap-hbar-val">{formatted ?? fmtNum(value)}</span>
    </div>
  );
}

/* ── Donut Segment (SVG) ── */
function DonutChart({ segments, total }) {
  const size = 160;
  const r = 56;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const len = pct * circ;
    const arc = { ...s, dasharray: `${len} ${circ}`, dashoffset: -offset * circ };
    offset += pct;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ap-donut">
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={20}
          strokeDasharray={a.dasharray}
          strokeDashoffset={a.dashoffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 800ms ease' }}
        />
      ))}
      <circle cx={cx} cy={cy} r={44} fill="white" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="700" fontFamily="Sora, sans-serif">
        {fmtNum(total)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="500" letterSpacing="0.04em">
        ORDERS
      </text>
    </svg>
  );
}

/* ── Monthly Bar Chart ── */
function MonthlyBars({ data }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="ap-bar-chart">
      {data.map((d, i) => {
        const pct = (d.revenue / max) * 100;
        return (
          <div key={i} className="ap-bar-col">
            <div className="ap-bar-wrap">
              <div
                className="ap-bar"
                style={{ height: `${pct}%` }}
                title={`${d.month}: ${fmt(d.revenue)}`}
              />
            </div>
            <span className="ap-bar-label">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');

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

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const isLoading = statsLoading || ordersLoading || productsLoading || customersLoading;

  /* ── Derived Analytics ── */
  const analytics = useMemo(() => {
    if (!orders.length && !products.length) return null;

    /* Revenue by month */
    const revenueByMonth = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS[i],
      revenue: 0,
      orders: 0,
    }));

    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      const d = new Date(o.created_at ?? Date.now());
      const m = d.getMonth();
      revenueByMonth[m].revenue += parseFloat(o.total_amount ?? 0);
      revenueByMonth[m].orders += 1;
    });

    /* Keep only months with any data — fall back to last 6 months */
    const now = new Date();
    const recentMonths = Array.from({ length: 6 }, (_, i) => {
      const idx = (now.getMonth() - 5 + i + 12) % 12;
      return revenueByMonth[idx];
    });

    /* Status distribution */
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    const donutSegments = Object.entries(STATUS_COLORS)
      .map(([key, color]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: statusCounts[key] ?? 0,
        color,
      }))
      .filter((s) => s.value > 0);

    /* Category breakdown */
    const categoryRevMap = {};
    products.forEach((p) => {
      const cat = p.category ?? 'Uncategorized';
      categoryRevMap[cat] = (categoryRevMap[cat] ?? 0) + parseFloat(p.price ?? 0) * parseInt(p.quantity ?? 0);
    });
    const topCategories = Object.entries(categoryRevMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const maxCatVal = topCategories[0]?.[1] ?? 1;

    /* Customer metrics */
    const totalCustomers = Array.isArray(customers) ? customers.length : 0;

    /* Revenue totals */
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + parseFloat(o.total_amount ?? 0), 0);

    const deliveredCount = statusCounts['delivered'] ?? 0;
    const cancelledCount = statusCounts['cancelled'] ?? 0;
    const fulfillmentRate = orders.length > 0
      ? ((deliveredCount / orders.length) * 100).toFixed(1)
      : '0.0';

    const cancelRate = orders.length > 0
      ? ((cancelledCount / orders.length) * 100).toFixed(1)
      : '0.0';

    const avgOrderVal = orders.length > 0 ? totalRevenue / orders.length : 0;

    /* Product turnover: % of products with qty < 20 */
    const movingProducts = products.filter((p) => parseInt(p.quantity ?? 0) < 20).length;
    const turnoverRate = products.length > 0
      ? ((movingProducts / products.length) * 100).toFixed(1)
      : '0.0';

    /* Top customers by order count */
    const custOrderMap = {};
    orders.forEach((o) => {
      const name = o.customer_name ?? o.customer?.name ?? `Customer #${o.customer_id}`;
      custOrderMap[name] = (custOrderMap[name] ?? 0) + 1;
    });
    const topCustomers = Object.entries(custOrderMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const maxCustOrders = topCustomers[0]?.[1] ?? 1;

    return {
      recentMonths,
      donutSegments,
      statusCounts,
      topCategories,
      maxCatVal,
      totalRevenue,
      fulfillmentRate,
      cancelRate,
      avgOrderVal,
      turnoverRate,
      totalCustomers,
      topCustomers,
      maxCustOrders,
      totalOrders: orders.length,
      totalProducts: products.length,
    };
  }, [orders, products, customers]);

  const tabs = [
    { id: 'overview',   label: 'Overview',   icon: <Activity size={15} /> },
    { id: 'orders',     label: 'Orders',     icon: <ShoppingCart size={15} /> },
    { id: 'inventory',  label: 'Inventory',  icon: <Package size={15} /> },
    { id: 'customers',  label: 'Customers',  icon: <Users size={15} /> },
  ];

  if (isLoading) {
    return (
      <div className="container ap-page">
        <div className="ap-skeleton-header" />
        <div className="ap-skeleton-kpis">
          {[...Array(4)].map((_, i) => <div key={i} className="ap-skeleton-kpi" />)}
        </div>
        <div className="ap-skeleton-charts">
          <div className="ap-skeleton-chart" />
          <div className="ap-skeleton-chart" />
        </div>
      </div>
    );
  }

  return (
    <div className="container ap-page">
      {/* ─── HEADER ─── */}
      <div className="ap-header">
        <div>
          <h1 className="ap-title">Analytics</h1>
          <p className="ap-subtitle">
            Performance metrics · trends · business intelligence
          </p>
        </div>
        <div className="ap-live-badge">
          <span className="ap-live-dot" />
          Live data
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="ap-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`ap-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── KPI CARDS ─── */}
      <div className="ap-kpi-grid">
        <KpiCard
          label="Total Revenue"
          value={fmt(analytics?.totalRevenue)}
          sub="From active orders"
          icon={<DollarSign size={18} />}
          trend="+12.4%"
          trendDir="up"
          color="#06b6d4"
        />
        <KpiCard
          label="Total Orders"
          value={fmtNum(analytics?.totalOrders)}
          sub="All time"
          icon={<ShoppingCart size={18} />}
          trend="+8.1%"
          trendDir="up"
          color="#3b82f6"
        />
        <KpiCard
          label="Total Customers"
          value={fmtNum(analytics?.totalCustomers)}
          sub="Registered accounts"
          icon={<Users size={18} />}
          trend="+5.3%"
          trendDir="up"
          color="#10b981"
        />
        <KpiCard
          label="Fulfillment Rate"
          value={`${analytics?.fulfillmentRate}%`}
          sub="Delivered vs total"
          icon={<TrendingUp size={18} />}
          trend={`${analytics?.cancelRate}% cancelled`}
          trendDir={parseFloat(analytics?.cancelRate) > 10 ? 'down' : 'flat'}
          color="#8b5cf6"
        />
      </div>

      {/* ─── MAIN CHARTS GRID ─── */}
      <div className="ap-charts-grid">

        {/* LEFT: Revenue Bar Chart */}
        <div className="ap-chart-card">
          <div className="ap-chart-header">
            <div>
              <h2 className="ap-chart-title">
                <BarChart3 size={16} />
                Monthly Revenue
              </h2>
              <p className="ap-chart-sub">Last 6 months · non-cancelled orders</p>
            </div>
            <div className="ap-chart-total">{fmt(analytics?.totalRevenue)}</div>
          </div>
          <div className="ap-chart-body">
            <MonthlyBars data={analytics?.recentMonths ?? []} />
          </div>
        </div>

        {/* RIGHT: Order Status Donut */}
        <div className="ap-chart-card">
          <div className="ap-chart-header">
            <div>
              <h2 className="ap-chart-title">
                <PieChart size={16} />
                Order Status
              </h2>
              <p className="ap-chart-sub">Distribution across all orders</p>
            </div>
          </div>
          <div className="ap-donut-body">
            <DonutChart
              segments={analytics?.donutSegments ?? []}
              total={analytics?.totalOrders ?? 0}
            />
            <div className="ap-donut-legend">
              {analytics?.donutSegments?.map((s) => (
                <div key={s.label} className="ap-legend-row">
                  <span className="ap-legend-dot" style={{ background: s.color }} />
                  <span className="ap-legend-label">{s.label}</span>
                  <span className="ap-legend-val">{s.value}</span>
                  <span className="ap-legend-pct">
                    {analytics.totalOrders > 0
                      ? `${((s.value / analytics.totalOrders) * 100).toFixed(0)}%`
                      : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECONDARY CHARTS ROW ─── */}
      <div className="ap-secondary-grid">

        {/* Category Inventory Value */}
        <div className="ap-chart-card">
          <div className="ap-chart-header">
            <div>
              <h2 className="ap-chart-title">
                <Package size={16} />
                Inventory by Category
              </h2>
              <p className="ap-chart-sub">Stock value per category</p>
            </div>
          </div>
          <div className="ap-hbar-list">
            {(analytics?.topCategories ?? []).length === 0 ? (
              <div className="ap-empty">No category data available</div>
            ) : (
              analytics.topCategories.map(([cat, val], i) => (
                <HorizontalBar
                  key={cat}
                  label={cat}
                  value={val}
                  max={analytics.maxCatVal}
                  color={['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 6]}
                  formatted={fmt(val)}
                />
              ))
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="ap-chart-card">
          <div className="ap-chart-header">
            <div>
              <h2 className="ap-chart-title">
                <Users size={16} />
                Top Customers
              </h2>
              <p className="ap-chart-sub">By number of orders placed</p>
            </div>
          </div>
          <div className="ap-hbar-list">
            {(analytics?.topCustomers ?? []).length === 0 ? (
              <div className="ap-empty">No customer order data available</div>
            ) : (
              analytics.topCustomers.map(([name, count], i) => (
                <HorizontalBar
                  key={name}
                  label={name}
                  value={count}
                  max={analytics.maxCustOrders}
                  color={['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][i % 6]}
                  formatted={`${count} order${count !== 1 ? 's' : ''}`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── PERFORMANCE METRICS STRIP ─── */}
      <div className="ap-perf-strip">
        <div className="ap-perf-item">
          <span className="ap-perf-val">{fmt(analytics?.avgOrderVal)}</span>
          <span className="ap-perf-label">Avg. Order Value</span>
        </div>
        <div className="ap-perf-divider" />
        <div className="ap-perf-item">
          <span className="ap-perf-val">{analytics?.fulfillmentRate}%</span>
          <span className="ap-perf-label">Fulfillment Rate</span>
        </div>
        <div className="ap-perf-divider" />
        <div className="ap-perf-item">
          <span className="ap-perf-val">{analytics?.cancelRate}%</span>
          <span className="ap-perf-label">Cancellation Rate</span>
        </div>
        <div className="ap-perf-divider" />
        <div className="ap-perf-item">
          <span className="ap-perf-val">{analytics?.turnoverRate}%</span>
          <span className="ap-perf-label">Low-Stock Rate</span>
        </div>
        <div className="ap-perf-divider" />
        <div className="ap-perf-item">
          <span className="ap-perf-val">{fmtNum(analytics?.totalProducts)}</span>
          <span className="ap-perf-label">Total SKUs</span>
        </div>
        <div className="ap-perf-divider" />
        <div className="ap-perf-item">
          <span className="ap-perf-val">{fmtNum(analytics?.totalCustomers)}</span>
          <span className="ap-perf-label">Total Customers</span>
        </div>
      </div>
    </div>
  );
}

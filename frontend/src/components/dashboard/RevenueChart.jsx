import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import './RevenueChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-date">{label}</p>
        <p className="chart-tooltip-value">
          ${parseFloat(payload[0].value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ orders = [] }) {
  const chartData = useMemo(() => {
    // Group orders by date (YYYY-MM-DD)
    const grouped = {};
    
    // Sort all orders by date first
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    sortedOrders.forEach((order) => {
      if (!order.created_at || order.status === 'cancelled') return;
      
      const dateObj = new Date(order.created_at);
      const dateStr = dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });

      grouped[dateStr] = (grouped[dateStr] || 0) + parseFloat(order.total_amount);
    });

    const data = Object.keys(grouped).map((date) => ({
      date,
      revenue: grouped[date],
    }));

    // If no data, return fallback mock progression for clean visuals
    if (data.length === 0) {
      return [
        { date: 'No Orders', revenue: 0 }
      ];
    }

    return data;
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  }, [orders]);

  return (
    <div className="revenue-chart-card">
      <div className="revenue-chart-header">
        <h3 className="revenue-chart-title">Revenue Flow</h3>
        <span className="revenue-chart-subtitle">
          Total Cumulative: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong> (Excluding Cancelled Orders)
        </span>
      </div>

      <div className="revenue-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-secondary)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--accent)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

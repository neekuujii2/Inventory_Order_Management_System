import React from 'react';
import './Skeleton.css';

export function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', className = '' }) {
  return (
    <span
      className={`skeleton-base ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table-wrapper" aria-hidden="true">
      <div className="skeleton-table-header">
        <Skeleton width="150px" height="24px" />
      </div>
      {Array.from({ length: rows }).map((_, rIndex) => (
        <div key={rIndex} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, cIndex) => (
            <Skeleton
              key={cIndex}
              width={cIndex === 0 ? '60px' : cIndex === cols - 1 ? '80px' : '120px'}
              height="16px"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards() {
  return (
    <div className="skeleton-cards-grid" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Skeleton width="40px" height="40px" borderRadius="var(--radius-full)" />
            <Skeleton width="100px" height="20px" />
          </div>
          <Skeleton width="120px" height="32px" style={{ marginTop: '0.5rem' }} />
          <Skeleton width="70%" height="14px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="skeleton-chart-box" aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="150px" height="20px" />
          <Skeleton width="80px" height="14px" />
        </div>
        <Skeleton width="60px" height="24px" />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '200px', margin: '1.5rem 0' }}>
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={index}
            width="100%"
            height={`${15 + Math.random() * 80}%`}
            borderRadius="var(--radius-sm) var(--radius-sm) 0 0"
          />
        ))}
      </div>
    </div>
  );
}

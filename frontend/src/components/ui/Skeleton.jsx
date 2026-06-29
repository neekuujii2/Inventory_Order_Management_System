import React from 'react';

import './Skeleton.css';

export function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', className = '', style = {} }) {
  return <span className={`skeleton-base ${className}`} style={{ width, height, borderRadius, ...style }} />;
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="surface-card skeleton-table-wrapper" aria-hidden="true">
      <div className="skeleton-table-header">
        <Skeleton width="180px" height="24px" />
        <Skeleton width="84px" height="38px" borderRadius="999px" />
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={colIndex === 0 ? '72px' : colIndex === cols - 1 ? '92px' : '100%'}
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
        <div key={index} className="surface-card skeleton-card">
          <div className="skeleton-card__head">
            <Skeleton width="52px" height="52px" borderRadius="18px" />
            <Skeleton width="110px" height="16px" />
          </div>
          <Skeleton width="48%" height="34px" />
          <Skeleton width="68%" height="14px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="surface-card skeleton-chart-box" aria-hidden="true">
      <div className="skeleton-chart-box__head">
        <div className="skeleton-chart-box__title">
          <Skeleton width="180px" height="20px" />
          <Skeleton width="110px" height="14px" />
        </div>
        <Skeleton width="90px" height="36px" borderRadius="999px" />
      </div>
      <div className="skeleton-chart-bars">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton
            key={index}
            width="100%"
            height={`${25 + (index % 5) * 12}%`}
            borderRadius="16px 16px 6px 6px"
          />
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import './FeaturesSection.css';

export default function FeaturesSection() {
  const features = [
    { title: 'Real-time Tracking', desc: 'Monitor your inventory across multiple warehouses in real-time.' },
    { title: 'Smart Restocking', desc: 'Automated alerts when stock levels fall below thresholds.' },
    { title: 'Detailed Analytics', desc: 'Comprehensive dashboards to track sales and stock performance.' }
  ];

  return (
    <section className="features-section">
      <h2 className="features-title">Core Features</h2>
      <div className="features-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <h3 className="feature-card-title">{f.title}</h3>
            <p className="feature-card-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

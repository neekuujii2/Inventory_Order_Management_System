import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import Footer from './Footer';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout-container">
      <TopNav />
      <main className="layout-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
